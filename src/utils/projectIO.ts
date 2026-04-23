import { useFragmentsStore, type Fragment, type DocumentProject } from '../store/useFragmentsStore';
import { useAppStore, type Code, type Memo, type CodeLink, type FileEntry } from '../store/useAppStore';

export const PROJECT_FORMAT = 'fragments-project';
export const PROJECT_VERSION = 1;

export interface ProjectBundle {
  format: typeof PROJECT_FORMAT;
  version: number;
  savedAt: string;
  meta?: {
    title?: string;
    note?: string;
  };
  fragmentsStore: {
    fragments: Fragment[];
    documents: DocumentProject[];
    activeFragmentId: string | null;
    activeDocumentId: string | null;
  };
  appStore: {
    files: FileEntry[];
    activeFileId: string | null;
    codes: Code[];
    memos: Memo[];
    codeLinks: CodeLink[];
    theoryLabel: string;
  };
}

export function buildProjectBundle(meta?: ProjectBundle['meta']): ProjectBundle {
  const f = useFragmentsStore.getState();
  const q = useAppStore.getState();
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    meta,
    fragmentsStore: {
      fragments: f.fragments,
      documents: f.documents,
      activeFragmentId: f.activeFragmentId,
      activeDocumentId: f.activeDocumentId,
    },
    appStore: {
      files: q.files,
      activeFileId: q.activeFileId,
      codes: q.codes,
      memos: q.memos,
      codeLinks: q.codeLinks,
      theoryLabel: q.theoryLabel,
    },
  };
}

export function downloadProjectFile(fileName?: string) {
  const bundle = buildProjectBundle();
  const safe = (fileName?.trim() || defaultProjectName()).replace(/[\\/:*?"<>|]/g, '_');
  const finalName = safe.endsWith('.fragments.json') ? safe : `${safe}.fragments.json`;
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return finalName;
}

function defaultProjectName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `fragments-project-${stamp}`;
}

export function applyProjectBundle(bundle: ProjectBundle) {
  if (bundle.format !== PROJECT_FORMAT) {
    throw new Error(`このファイルは fragments のプロジェクトファイルではありません (format: ${bundle.format})`);
  }
  if (bundle.version > PROJECT_VERSION) {
    throw new Error(
      `このファイルは新しいバージョン (v${bundle.version}) で保存されています。アプリを更新してください。`
    );
  }

  // Restore fragments store (preserving active selections if they still exist)
  const fs = bundle.fragmentsStore;
  const frags = fs.fragments ?? [];
  const docs = fs.documents ?? [];
  const activeFragmentId =
    fs.activeFragmentId && frags.some((f) => f.id === fs.activeFragmentId)
      ? fs.activeFragmentId
      : frags[0]?.id ?? null;
  const activeDocumentId =
    fs.activeDocumentId && docs.some((d) => d.id === fs.activeDocumentId)
      ? fs.activeDocumentId
      : docs[0]?.id ?? null;

  useFragmentsStore.setState({
    fragments: frags,
    documents: docs,
    activeFragmentId,
    activeDocumentId,
  });

  // Restore QDA store
  const qs = bundle.appStore;
  useAppStore.getState().restoreState({
    files: qs.files ?? [],
    activeFileId: qs.activeFileId ?? null,
    codes: qs.codes ?? [],
    memos: qs.memos ?? [],
    codeLinks: qs.codeLinks ?? [],
    theoryLabel: qs.theoryLabel ?? '',
  });
}

export async function importProjectFile(file: File): Promise<ProjectBundle> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSONとして読み込めないファイルです');
  }
  const bundle = parsed as ProjectBundle;
  applyProjectBundle(bundle);
  return bundle;
}

export function projectSummary(bundle: ProjectBundle): string {
  const { fragmentsStore, appStore } = bundle;
  return [
    `断片 ${fragmentsStore.fragments.length}`,
    `ドキュメント ${fragmentsStore.documents.length}`,
    `QDAファイル ${appStore.files.length}`,
    `コード ${appStore.codes.length}`,
    `メモ ${appStore.memos.length}`,
  ].join(' / ');
}
