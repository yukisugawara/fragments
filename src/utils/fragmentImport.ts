import { useFragmentsStore, type Fragment } from '../store/useFragmentsStore';

export interface ImportReport {
  imported: number;
  skipped: number;
  errors: Array<{ name: string; message: string }>;
}

function titleFromFilename(filename: string): string {
  // Strip directory
  const base = filename.split('/').pop() ?? filename;
  // Strip extension
  return base.replace(/\.(md|markdown|txt)$/i, '').trim() || 'Untitled';
}

function uniqueTitle(existing: Fragment[], base: string): string {
  const titles = new Set(existing.map((f) => f.title.toLowerCase()));
  if (!titles.has(base.toLowerCase())) return base;
  let n = 2;
  while (titles.has(`${base} ${n}`.toLowerCase())) n++;
  return `${base} ${n}`;
}

export async function importMarkdownFiles(fileList: FileList | File[]): Promise<ImportReport> {
  const report: ImportReport = { imported: 0, skipped: 0, errors: [] };
  const files = Array.from(fileList);

  const markdownFiles = files.filter((f) => {
    const name = f.name.toLowerCase();
    return name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt');
  });

  if (markdownFiles.length === 0) {
    return report;
  }

  const now = Date.now();
  const newFragments: Fragment[] = [];
  // Snapshot existing titles (including the ones we're about to add) for unique-title resolution.
  const existingSnapshot = useFragmentsStore.getState().fragments;
  const workingList: Fragment[] = [...existingSnapshot];

  for (let i = 0; i < markdownFiles.length; i++) {
    const file = markdownFiles[i];
    try {
      const text = await file.text();
      // Prefer webkitRelativePath for folder imports, but use only the basename for title.
      const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const baseTitle = titleFromFilename(relPath);
      const title = uniqueTitle(workingList, baseTitle);
      const fragment: Fragment = {
        id: `frag-import-${now}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        content: text,
        createdAt: now + i,
        updatedAt: now + i,
      };
      newFragments.push(fragment);
      workingList.push(fragment);
      report.imported++;
    } catch (err) {
      report.errors.push({
        name: file.name,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  report.skipped = files.length - markdownFiles.length;

  if (newFragments.length > 0) {
    useFragmentsStore.setState((s) => ({
      fragments: [...s.fragments, ...newFragments],
      activeFragmentId: s.activeFragmentId ?? newFragments[0].id,
    }));
  }

  return report;
}
