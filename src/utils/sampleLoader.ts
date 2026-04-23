import { useFragmentsStore, type Fragment, type FragmentImage, type DocumentProject, type DocumentSection } from '../store/useFragmentsStore';
import { useAppStore, type Code, type Memo, type FileEntry, type CodeLink } from '../store/useAppStore';

interface SampleFragment {
  id: string;
  title: string;
  content: string;
}

interface SampleSection {
  id: string;
  title: string;
  content: string;
  fragmentIds: string[];
}

interface SampleDocument {
  id: string;
  title: string;
  sections: SampleSection[];
}

interface SampleCategory {
  id: string;
  name: string;
  color: string;
}

interface SampleCode {
  id: string;
  categoryId: string;
  text: string;
  color: string;
  fragmentId: string;
  anchor: string;
}

interface SampleMemo {
  id: string;
  codeId: string | null;
  content: string;
}

interface SampleImage {
  /** Filename used in ![[...]] references. */
  name: string;
  /** Relative URL under the public/ directory. */
  sourcePath: string;
  /** MIME type, defaults inferred from extension. */
  mime?: string;
  /** Optional caption — not used in rendering but useful for documentation. */
  caption?: string;
}

interface SampleBundle {
  version: number;
  id: string;
  title: string;
  description?: string;
  fragments: SampleFragment[];
  documents: SampleDocument[];
  images?: SampleImage[];
  qda: {
    categories: SampleCategory[];
    codes: SampleCode[];
    memos: SampleMemo[];
    codeLinks: CodeLink[];
    theoryLabel?: string;
  };
}

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  return 'image/png';
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status} ${url}`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function fetchSample(url: string): Promise<SampleBundle> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`サンプルの取得に失敗しました (${res.status})`);
  return (await res.json()) as SampleBundle;
}

export async function applySample(bundle: SampleBundle) {
  const now = Date.now();

  const fragments: Fragment[] = bundle.fragments.map((f, i) => ({
    id: f.id,
    title: f.title,
    content: f.content,
    createdAt: now - (bundle.fragments.length - i) * 1000,
    updatedAt: now - (bundle.fragments.length - i) * 1000,
  }));

  // --- Fetch sample images (if any) and load into the image library ---
  const base = import.meta.env.BASE_URL;
  const images: FragmentImage[] = [];
  const imageDataByName = new Map<string, { mime: string; dataUrl: string }>();
  if (bundle.images && bundle.images.length > 0) {
    await Promise.all(
      bundle.images.map(async (img, i) => {
        try {
          const url = `${base}${img.sourcePath}`.replace(/\/\//g, '/');
          const dataUrl = await fetchImageAsDataUrl(url);
          const mime = img.mime ?? mimeFromName(img.name);
          images.push({
            id: `img-sample-${i}`,
            name: img.name,
            mime,
            dataUrl,
            createdAt: now - (bundle.images!.length - i) * 1000,
          });
          imageDataByName.set(img.name.toLowerCase(), { mime, dataUrl });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[sample] failed to load image ${img.name}:`, err);
        }
      }),
    );
  }

  const documents: DocumentProject[] = bundle.documents.map((d) => ({
    id: d.id,
    title: d.title,
    sections: d.sections.map<DocumentSection>((s, i) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      fragmentIds: s.fragmentIds ?? [],
      order: i,
      parentId: null,
    })),
    createdAt: now,
    updatedAt: now,
  }));

  useFragmentsStore.setState({
    fragments,
    documents,
    images,
    activeFragmentId: fragments[0]?.id ?? null,
    activeDocumentId: documents[0]?.id ?? null,
    activePhase: 1,
  });

  // --- QDA side ---
  const files: FileEntry[] = bundle.fragments.map((f) => ({
    id: f.id,
    fileName: `${f.title}.md`,
    fileContent: f.content,
    fileType: 'md',
    fileDataUrl: null,
  }));

  // Also expose the sample images as QDA files so Phase 3 can analyse them.
  for (const img of images) {
    files.push({
      id: `fragimg-${img.id}`,
      fileName: img.name,
      fileContent: `[Image] ${img.name}`,
      fileType: img.name.split('.').pop()?.toLowerCase() ?? 'png',
      fileDataUrl: img.dataUrl,
    });
  }

  // minimal-qda stores category groups per-file (each file has its own tree).
  // For every (fileId, categoryId) pair touched by a code, we create a
  // category group whose fileId matches — otherwise the CodesPanel filter
  // (`c.fileId === activeFileId`) drops them entirely.
  const categoriesById = new Map(bundle.qda.categories.map((c) => [c.id, c]));
  const usedByFile = new Map<string, Set<string>>();
  for (const c of bundle.qda.codes) {
    if (!usedByFile.has(c.fragmentId)) usedByFile.set(c.fragmentId, new Set());
    usedByFile.get(c.fragmentId)!.add(c.categoryId);
  }

  const groupCodes: Code[] = [];
  /** Maps "${fileId}:${categoryId}" → generated group code id. */
  const groupIdMap = new Map<string, string>();
  let groupOrder = 0;
  for (const [fileId, catIds] of usedByFile) {
    // Preserve the original category order defined in the bundle
    for (const cat of bundle.qda.categories) {
      if (!catIds.has(cat.id)) continue;
      const groupId = `grp--${cat.id}--${fileId}`;
      groupCodes.push({
        id: groupId,
        text: cat.name,
        color: cat.color,
        parentId: null,
        order: groupOrder++,
        fileId,
        startOffset: 0,
        endOffset: 0,
      });
      groupIdMap.set(`${fileId}:${cat.id}`, groupId);
    }
  }

  const childCodes: Code[] = bundle.qda.codes.map((c, i) => {
    const fragment = bundle.fragments.find((f) => f.id === c.fragmentId);
    const content = fragment?.content ?? '';
    const idx = content.indexOf(c.anchor);
    if (idx < 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[sample] anchor text not found — fragment="${fragment?.title}" anchor="${c.anchor}"`
      );
    }
    const category = categoriesById.get(c.categoryId);
    const parentId = groupIdMap.get(`${c.fragmentId}:${c.categoryId}`) ?? null;
    return {
      id: c.id,
      text: c.text,
      color: c.color || category?.color || '#9CA3AF',
      parentId,
      order: i,
      fileId: c.fragmentId,
      startOffset: Math.max(0, idx),
      endOffset: idx >= 0 ? idx + c.anchor.length : 0,
    };
  });

  const memos: Memo[] = bundle.qda.memos.map((m, i) => ({
    id: m.id,
    codeId: m.codeId,
    content: m.content,
    createdAt: now - (bundle.qda.memos.length - i) * 1000,
    parentId: null,
    order: i,
  }));

  // Land the user on the first file that actually has codes — so Phase 3
  // feels alive right after the sample loads instead of opening the readme
  // (which has no coding).
  const firstCodedFileId = bundle.qda.codes[0]?.fragmentId ?? files[0]?.id ?? null;

  useAppStore.getState().restoreState({
    files,
    activeFileId: firstCodedFileId,
    codes: [...groupCodes, ...childCodes],
    memos,
    codeLinks: bundle.qda.codeLinks ?? [],
    theoryLabel: bundle.qda.theoryLabel ?? '',
  });
}

export async function loadSampleFromUrl(url: string) {
  const bundle = await fetchSample(url);
  await applySample(bundle);
  return bundle;
}

export function clearAllData() {
  useFragmentsStore.setState({
    fragments: [],
    documents: [],
    images: [],
    activeFragmentId: null,
    activeDocumentId: null,
    activePhase: 1,
  });
  useAppStore.getState().restoreState({
    files: [],
    activeFileId: null,
    codes: [],
    memos: [],
    codeLinks: [],
    theoryLabel: '',
  });
}
