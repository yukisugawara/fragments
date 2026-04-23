import { useEffect, useState } from 'react';
import { useFragmentsStore } from '../../store/useFragmentsStore';
import { DocumentTopBar } from './DocumentTopBar';
import { BinderPanel } from './BinderPanel';
import { SectionEditor } from './SectionEditor';
import { FragmentLibrary } from './FragmentLibrary';

export function Phase4Document() {
  const documents = useFragmentsStore((s) => s.documents);
  const activeDocumentId = useFragmentsStore((s) => s.activeDocumentId);
  const setActiveDocumentId = useFragmentsStore((s) => s.setActiveDocumentId);
  const createDocument = useFragmentsStore((s) => s.createDocument);
  const activeDoc = documents.find((d) => d.id === activeDocumentId) ?? null;

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDocumentId && documents.length > 0) {
      setActiveDocumentId(documents[0].id);
    }
  }, [activeDocumentId, documents, setActiveDocumentId]);

  useEffect(() => {
    // Reset section selection when switching docs, and pick first section if available
    if (!activeDoc) {
      setActiveSectionId(null);
      return;
    }
    const stillExists = activeDoc.sections.some((s) => s.id === activeSectionId);
    if (!stillExists) {
      const first = [...activeDoc.sections].sort((a, b) => a.order - b.order)[0];
      setActiveSectionId(first?.id ?? null);
    }
  }, [activeDoc, activeSectionId]);

  const activeSection = activeDoc?.sections.find((s) => s.id === activeSectionId) ?? null;

  if (documents.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cream-50 dark:bg-dpurple-950 gap-3 px-6">
        <div className="text-lg font-semibold text-violet-700 dark:text-violet-200">
          フェーズ4：ドキュメントをつくる
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md text-center leading-relaxed">
          バインダーでセクションを並べ替えながら、フェーズ1で書いた断片を組み合わせて
          長い文章を組み立てます。
        </p>
        <button
          onClick={() => createDocument('新しいドキュメント')}
          className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow"
        >
          + 最初のドキュメントを作成
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cream-50 dark:bg-dpurple-950">
      <DocumentTopBar />
      {activeDoc ? (
        <div
          className="flex-1 min-h-0 grid phase4-section-editor"
          style={{ gridTemplateColumns: '240px 1fr 280px' }}
        >
          <BinderPanel
            doc={activeDoc}
            activeSectionId={activeSectionId}
            onSelectSection={setActiveSectionId}
          />
          <SectionEditor doc={activeDoc} section={activeSection} />
          <FragmentLibrary doc={activeDoc} section={activeSection} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          上のタブからドキュメントを選ぶか、「+ 新規」で作成してください
        </div>
      )}
    </div>
  );
}
