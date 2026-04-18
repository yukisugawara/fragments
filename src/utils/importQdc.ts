import type { Code } from '../store/useAppStore';
import { parseCodeBook, buildGroupTreeForFile } from './importQdpx';

/**
 * Parse a REFI-QDA codebook (.qdc) file and return a list of "group" Code
 * entries (one per imported code, with startOffset=endOffset=0). The returned
 * entries carry an empty `fileId` — the caller must fill it in with the
 * target file id before appending to the store.
 */
export async function importQdc(file: File): Promise<Code[]> {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const parseError = doc.getElementsByTagName('parsererror')[0];
  if (parseError) {
    throw new Error('Failed to parse .qdc XML');
  }

  const codeMap = parseCodeBook(doc);
  if (codeMap.size === 0) {
    throw new Error('.qdc file contained no codes');
  }

  const codes: Code[] = [];
  buildGroupTreeForFile(codeMap, '', codes);
  return codes;
}
