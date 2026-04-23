import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Phase = 1 | 2 | 3 | 4;

export interface Fragment {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface FragmentImage {
  id: string;
  name: string;     // filename used inside ![[...]] — must be unique (case-insensitive)
  mime: string;
  dataUrl: string;  // base64 data URL
  createdAt: number;
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  fragmentIds: string[];
  order: number;
  parentId: string | null;
}

export interface DocumentProject {
  id: string;
  title: string;
  sections: DocumentSection[];
  createdAt: number;
  updatedAt: number;
}

interface FragmentsState {
  activePhase: Phase;
  fragments: Fragment[];
  activeFragmentId: string | null;
  images: FragmentImage[];
  documents: DocumentProject[];
  activeDocumentId: string | null;

  setActivePhase: (phase: Phase) => void;
  createFragment: (title?: string, content?: string) => Fragment;
  updateFragment: (id: string, patch: Partial<Pick<Fragment, 'title' | 'content'>>) => void;
  deleteFragment: (id: string) => void;
  setActiveFragmentId: (id: string | null) => void;
  getFragmentByTitle: (title: string) => Fragment | undefined;
  ensureFragmentByTitle: (title: string) => Fragment;

  addImage: (file: File | Blob, suggestedName?: string) => Promise<FragmentImage>;
  getImageByName: (name: string) => FragmentImage | undefined;
  removeImage: (id: string) => void;

  createDocument: (title?: string) => DocumentProject;
  updateDocument: (id: string, patch: Partial<Pick<DocumentProject, 'title'>>) => void;
  deleteDocument: (id: string) => void;
  setActiveDocumentId: (id: string | null) => void;
  addSection: (docId: string, section?: Partial<DocumentSection>) => DocumentSection;
  updateSection: (docId: string, sectionId: string, patch: Partial<DocumentSection>) => void;
  removeSection: (docId: string, sectionId: string) => void;
  moveSection: (docId: string, sectionId: string, newOrder: number) => void;
}

let counter = 0;
function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${(++counter).toString(36)}`;
}

function uniqueTitle(existing: Fragment[], base: string): string {
  const titles = new Set(existing.map((f) => f.title.toLowerCase()));
  if (!titles.has(base.toLowerCase())) return base;
  let n = 2;
  while (titles.has(`${base} ${n}`.toLowerCase())) n++;
  return `${base} ${n}`;
}

function uniqueImageName(existing: FragmentImage[], base: string): string {
  const names = new Set(existing.map((i) => i.name.toLowerCase()));
  if (!names.has(base.toLowerCase())) return base;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  let n = 2;
  while (names.has(`${stem}-${n}${ext}`.toLowerCase())) n++;
  return `${stem}-${n}${ext}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/gif') return '.gif';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/svg+xml') return '.svg';
  return '.png';
}

export const useFragmentsStore = create<FragmentsState>()(
  persist(
    (set, get) => ({
      activePhase: 1,
      fragments: [],
      activeFragmentId: null,
      images: [],
      documents: [],
      activeDocumentId: null,

      setActivePhase: (phase) => set({ activePhase: phase }),

      createFragment: (title, content = '') => {
        const now = Date.now();
        const base = (title && title.trim()) || 'Untitled';
        const finalTitle = uniqueTitle(get().fragments, base);
        const fragment: Fragment = {
          id: nextId('frag'),
          title: finalTitle,
          content,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          fragments: [...state.fragments, fragment],
          activeFragmentId: fragment.id,
        }));
        return fragment;
      },

      updateFragment: (id, patch) =>
        set((state) => ({
          fragments: state.fragments.map((f) =>
            f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f
          ),
        })),

      deleteFragment: (id) =>
        set((state) => ({
          fragments: state.fragments.filter((f) => f.id !== id),
          activeFragmentId: state.activeFragmentId === id ? null : state.activeFragmentId,
        })),

      setActiveFragmentId: (id) => set({ activeFragmentId: id }),

      getFragmentByTitle: (title) => {
        const lower = title.trim().toLowerCase();
        return get().fragments.find((f) => f.title.toLowerCase() === lower);
      },

      ensureFragmentByTitle: (title) => {
        const existing = get().getFragmentByTitle(title);
        if (existing) return existing;
        return get().createFragment(title);
      },

      addImage: async (file, suggestedName) => {
        const dataUrl = await blobToDataUrl(file);
        const mime = file.type || 'image/png';
        const baseName =
          suggestedName?.trim() ||
          ('name' in file && typeof (file as File).name === 'string' && (file as File).name
            ? (file as File).name
            : `pasted-${Date.now().toString(36)}${extFromMime(mime)}`);
        const name = uniqueImageName(get().images, baseName);
        const image: FragmentImage = {
          id: nextId('img'),
          name,
          mime,
          dataUrl,
          createdAt: Date.now(),
        };
        set((state) => ({ images: [...state.images, image] }));
        return image;
      },

      getImageByName: (name) => {
        const lower = name.trim().toLowerCase();
        return get().images.find((i) => i.name.toLowerCase() === lower);
      },

      removeImage: (id) =>
        set((state) => ({ images: state.images.filter((i) => i.id !== id) })),

      createDocument: (title = 'Untitled Document') => {
        const now = Date.now();
        const doc: DocumentProject = {
          id: nextId('doc'),
          title,
          sections: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          documents: [...state.documents, doc],
          activeDocumentId: doc.id,
        }));
        return doc;
      },

      updateDocument: (id, patch) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d
          ),
        })),

      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
          activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
        })),

      setActiveDocumentId: (id) => set({ activeDocumentId: id }),

      addSection: (docId, partial = {}) => {
        const doc = get().documents.find((d) => d.id === docId);
        const order = doc ? doc.sections.length : 0;
        const section: DocumentSection = {
          id: nextId('sec'),
          title: partial.title ?? 'New Section',
          content: partial.content ?? '',
          fragmentIds: partial.fragmentIds ?? [],
          order,
          parentId: partial.parentId ?? null,
        };
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === docId ? { ...d, sections: [...d.sections, section], updatedAt: Date.now() } : d
          ),
        }));
        return section;
      },

      updateSection: (docId, sectionId, patch) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  sections: d.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
                  updatedAt: Date.now(),
                }
              : d
          ),
        })),

      removeSection: (docId, sectionId) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  sections: d.sections.filter((s) => s.id !== sectionId),
                  updatedAt: Date.now(),
                }
              : d
          ),
        })),

      moveSection: (docId, sectionId, newOrder) =>
        set((state) => ({
          documents: state.documents.map((d) => {
            if (d.id !== docId) return d;
            const target = d.sections.find((s) => s.id === sectionId);
            if (!target) return d;
            const others = d.sections
              .filter((s) => s.id !== sectionId)
              .sort((a, b) => a.order - b.order);
            const clampedOrder = Math.max(0, Math.min(newOrder, others.length));
            others.splice(clampedOrder, 0, target);
            return {
              ...d,
              sections: others.map((s, i) => ({ ...s, order: i })),
              updatedAt: Date.now(),
            };
          }),
        })),
    }),
    {
      name: 'fragments-store',
      version: 1,
    }
  )
);
