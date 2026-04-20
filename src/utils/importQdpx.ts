import JSZip from 'jszip';
import { nextFileId } from '../store/useAppStore';
import type { Code, FileEntry, ProjectData } from '../store/useAppStore';

const BINARY_SOURCE_EXTS = new Set(['png', 'jpg', 'jpeg', 'pdf']);

let idCounter = 0;
export function nextLocalId(prefix: 'code' | 'group'): string {
  return `${prefix}-qdpx-${++idCounter}-${Date.now()}`;
}

export interface CodeInfo {
  guid: string;
  name: string;
  color: string;
  parentGuid: string | null;
}

function getChildrenByLocalName(parent: Element, localName: string): Element[] {
  const result: Element[] = [];
  for (const child of Array.from(parent.children)) {
    if (child.localName === localName) result.push(child);
  }
  return result;
}

/**
 * Walks the first `<Codes>` element in the document. Works for both:
 * - project.qde (Project > CodeBook > Codes)
 * - *.qdc codebook (CodeBook > Codes, or Codes as root)
 */
export function parseCodeBook(doc: Document): Map<string, CodeInfo> {
  const map = new Map<string, CodeInfo>();
  const codesRoots = doc.getElementsByTagNameNS('*', 'Codes');
  if (codesRoots.length === 0) return map;

  function walk(el: Element, parentGuid: string | null) {
    for (const child of getChildrenByLocalName(el, 'Code')) {
      const guid = child.getAttribute('guid') ?? '';
      if (!guid) continue;
      const name = child.getAttribute('name') ?? '(unnamed)';
      const color = normalizeColor(child.getAttribute('color'));
      map.set(guid, { guid, name, color, parentGuid });
      walk(child, guid);
    }
  }

  walk(codesRoots[0], null);
  return map;
}

function normalizeColor(raw: string | null): string {
  if (!raw) return '#9CA3AF';
  const trimmed = raw.trim();
  if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(trimmed)) return trimmed;
  return '#9CA3AF';
}

function resolveInternalPath(raw: string | null): string | null {
  if (!raw) return null;
  const prefix = 'internal://';
  const rel = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
  return rel.replace(/^\/+/, '');
}

async function readTextFromZip(zip: JSZip, path: string): Promise<string | null> {
  const variants = [path, `sources/${path}`, `Sources/${path}`];
  for (const p of variants) {
    const f = zip.file(p);
    if (f) return await f.async('string');
  }
  return null;
}

async function readBinaryFromZip(
  zip: JSZip,
  path: string,
): Promise<{ data: ArrayBuffer; ext: string } | null> {
  const variants = [path, `sources/${path}`, `Sources/${path}`];
  for (const p of variants) {
    const f = zip.file(p);
    if (f) {
      const data = await f.async('arraybuffer');
      const ext = p.split('.').pop()?.toLowerCase() ?? '';
      return { data, ext };
    }
  }
  return null;
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mime: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function mimeForExt(ext: string): string {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

/**
 * For one source file: build per-file "group" Code nodes mirroring the
 * codebook hierarchy, so that coded segments can be parented under them.
 * Returns a map from code guid → our group Code id.
 */
export function buildGroupTreeForFile(
  codeMap: Map<string, CodeInfo>,
  fileId: string,
  codesOut: Code[],
  onlyGuids?: Set<string>,
): Map<string, string> {
  const guidToGroupId = new Map<string, string>();
  const orderCounter = new Map<string | null, number>();

  function nextOrder(parentId: string | null): number {
    const n = orderCounter.get(parentId) ?? 0;
    orderCounter.set(parentId, n + 1);
    return n;
  }

  function ensure(guid: string): string {
    const existing = guidToGroupId.get(guid);
    if (existing) return existing;
    const info = codeMap.get(guid);
    if (!info) {
      const orphanId = nextLocalId('group');
      guidToGroupId.set(guid, orphanId);
      codesOut.push({
        id: orphanId,
        text: '(unknown code)',
        color: '#9CA3AF',
        parentId: null,
        order: nextOrder(null),
        fileId,
        startOffset: 0,
        endOffset: 0,
      });
      return orphanId;
    }
    const parentId = info.parentGuid ? ensure(info.parentGuid) : null;
    const groupId = nextLocalId('group');
    guidToGroupId.set(guid, groupId);
    codesOut.push({
      id: groupId,
      text: info.name,
      color: info.color,
      parentId,
      order: nextOrder(parentId),
      fileId,
      startOffset: 0,
      endOffset: 0,
    });
    return groupId;
  }

  const guids = onlyGuids ?? new Set(codeMap.keys());
  for (const guid of guids) ensure(guid);
  return guidToGroupId;
}

interface BuiltFile {
  entry: FileEntry;
  sourceEl: Element;
  kind: 'text' | 'pdf' | 'image' | 'other';
}

async function buildFile(
  sourceEl: Element,
  zip: JSZip,
): Promise<BuiltFile | null> {
  const localName = sourceEl.localName;
  const guid = sourceEl.getAttribute('guid') ?? '';
  const name = sourceEl.getAttribute('name') || guid || 'source';
  const fileId = nextFileId();

  if (localName === 'TextSource') {
    // Inline content takes precedence; otherwise read from plainTextPath.
    const inlineEls = sourceEl.getElementsByTagNameNS('*', 'PlainTextContent');
    let text: string | null = null;
    if (inlineEls.length > 0) {
      text = inlineEls[0].textContent ?? '';
    } else {
      const pathAttr =
        sourceEl.getAttribute('plainTextPath') ??
        sourceEl.getAttribute('richTextPath');
      const resolved = resolveInternalPath(pathAttr);
      if (resolved) text = await readTextFromZip(zip, resolved);
    }
    if (text === null) text = '';
    return {
      entry: {
        id: fileId,
        fileName: name.endsWith('.txt') ? name : `${name}.txt`,
        fileContent: text,
        fileType: 'txt',
        fileDataUrl: null,
      },
      sourceEl,
      kind: 'text',
    };
  }

  if (localName === 'PDFSource' || localName === 'PictureSource') {
    const pathAttr = sourceEl.getAttribute('path');
    const resolved = resolveInternalPath(pathAttr);
    if (!resolved) return null;
    const bin = await readBinaryFromZip(zip, resolved);
    if (!bin) return null;
    const ext = BINARY_SOURCE_EXTS.has(bin.ext) ? bin.ext : 'pdf';
    const kind: 'pdf' | 'image' = localName === 'PDFSource' ? 'pdf' : 'image';
    const fileName = name.includes('.') ? name : `${name}.${ext}`;
    const dataUrl = arrayBufferToDataUrl(bin.data, mimeForExt(ext));
    return {
      entry: {
        id: fileId,
        fileName,
        fileContent: kind === 'image' ? `[Image] ${fileName}` : fileName,
        fileType: ext,
        fileDataUrl: dataUrl,
      },
      sourceEl,
      kind,
    };
  }

  // AudioSource / VideoSource / others: skip (not supported).
  return null;
}

function collectUsedGuids(sourceEl: Element, codeMap: Map<string, CodeInfo>): Set<string> {
  const direct = new Set<string>();
  const selections = sourceEl.getElementsByTagNameNS('*', 'PlainTextSelection');
  for (const sel of Array.from(selections)) {
    const refs = sel.getElementsByTagNameNS('*', 'CodeRef');
    for (const ref of Array.from(refs)) {
      const g = ref.getAttribute('targetGUID') ?? ref.getAttribute('targetGuid');
      if (g) direct.add(g);
    }
  }
  const withAncestors = new Set<string>();
  for (const guid of direct) {
    let cur: string | null = guid;
    while (cur && !withAncestors.has(cur)) {
      withAncestors.add(cur);
      cur = codeMap.get(cur)?.parentGuid ?? null;
    }
  }
  return withAncestors;
}

function extractTextSelections(
  sourceEl: Element,
  fileId: string,
  sourceText: string,
  guidToGroupId: Map<string, string>,
  codeMap: Map<string, CodeInfo>,
  codesOut: Code[],
) {
  const orderCounter = new Map<string, number>();
  const nextOrderUnder = (parentId: string) => {
    const n = orderCounter.get(parentId) ?? 0;
    orderCounter.set(parentId, n + 1);
    return n;
  };

  const selections = sourceEl.getElementsByTagNameNS('*', 'PlainTextSelection');
  for (const sel of Array.from(selections)) {
    const start = parseInt(sel.getAttribute('startPosition') ?? '0', 10);
    const end = parseInt(sel.getAttribute('endPosition') ?? '0', 10);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;

    const snippet = sourceText.slice(start, end).trim();

    const refs = sel.getElementsByTagNameNS('*', 'CodeRef');
    for (const ref of Array.from(refs)) {
      const targetGuid = ref.getAttribute('targetGUID') ?? ref.getAttribute('targetGuid');
      if (!targetGuid) continue;
      const parentId = guidToGroupId.get(targetGuid);
      if (!parentId) continue;
      const info = codeMap.get(targetGuid);
      codesOut.push({
        id: nextLocalId('code'),
        text: snippet || info?.name || '(code)',
        color: info?.color ?? '#9CA3AF',
        parentId,
        order: nextOrderUnder(parentId),
        fileId,
        startOffset: start,
        endOffset: end,
      });
    }
  }
}

export async function importQdpx(file: File): Promise<ProjectData> {
  const zip = await JSZip.loadAsync(file);
  // project.qde lives at the root; some exporters may nest it — fall back to search.
  let qdeFile = zip.file('project.qde');
  if (!qdeFile) {
    const candidates = zip.file(/project\.qde$/i);
    qdeFile = candidates[0] ?? null;
  }
  if (!qdeFile) {
    throw new Error('project.qde not found in .qdpx archive');
  }

  const qdeText = await qdeFile.async('string');
  const doc = new DOMParser().parseFromString(qdeText, 'application/xml');
  const parseError = doc.getElementsByTagName('parsererror')[0];
  if (parseError) {
    throw new Error('Failed to parse project.qde XML');
  }

  const codeMap = parseCodeBook(doc);

  const files: FileEntry[] = [];
  const codes: Code[] = [];

  const sourcesContainers = doc.getElementsByTagNameNS('*', 'Sources');
  const sourceEls: Element[] = [];
  if (sourcesContainers.length > 0) {
    for (const child of Array.from(sourcesContainers[0].children)) {
      sourceEls.push(child);
    }
  }

  for (const sourceEl of sourceEls) {
    const built = await buildFile(sourceEl, zip);
    if (!built) continue;
    files.push(built.entry);

    if (built.kind === 'text') {
      const usedGuids = collectUsedGuids(sourceEl, codeMap);
      const guidToGroupId = buildGroupTreeForFile(codeMap, built.entry.id, codes, usedGuids);
      extractTextSelections(
        sourceEl,
        built.entry.id,
        built.entry.fileContent,
        guidToGroupId,
        codeMap,
        codes,
      );
    }
    // Non-text sources: codebook selections for them (PDFSelection, PictureSelection)
    // use coordinate/page offsets that don't translate cleanly to our current model,
    // so we import the source file only. Text coding is the headline feature.
  }

  return {
    files,
    activeFileId: files[0]?.id ?? null,
    codes,
    memos: [],
    codeLinks: [],
  };
}
