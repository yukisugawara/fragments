import { useMemo, useState } from 'react';
import { useFragmentsStore } from '../../store/useFragmentsStore';
import { compileDocument, downloadMarkdown } from './compile';
import { renderDocumentBody, documentCss, openPdfPrintWindow } from './exportPdf';

export function DocumentTopBar() {
  const documents = useFragmentsStore((s) => s.documents);
  const activeDocumentId = useFragmentsStore((s) => s.activeDocumentId);
  const setActiveDocumentId = useFragmentsStore((s) => s.setActiveDocumentId);
  const createDocument = useFragmentsStore((s) => s.createDocument);
  const updateDocument = useFragmentsStore((s) => s.updateDocument);
  const deleteDocument = useFragmentsStore((s) => s.deleteDocument);
  const fragments = useFragmentsStore((s) => s.fragments);
  const activeDoc = documents.find((d) => d.id === activeDocumentId) ?? null;

  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex items-center gap-2 pl-[480px] pr-[120px] py-2 border-b border-violet-200/60 dark:border-dpurple-700/60 bg-white/70 dark:bg-dpurple-900/60 backdrop-blur">
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
        {documents.map((d) => {
          const active = d.id === activeDocumentId;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDocumentId(d.id)}
              className={[
                'shrink-0 px-3 py-1.5 text-sm rounded-lg transition-colors max-w-[240px] truncate',
                active
                  ? 'bg-violet-600 text-white'
                  : 'bg-cream-100 dark:bg-dpurple-800 text-violet-800 dark:text-violet-100 hover:bg-violet-100 dark:hover:bg-dpurple-700',
              ].join(' ')}
              title={d.title}
            >
              {d.title}
            </button>
          );
        })}
        <button
          onClick={() => createDocument('新しいドキュメント')}
          className="shrink-0 px-3 py-1.5 text-sm border border-dashed border-violet-300 dark:border-dpurple-600 text-violet-600 dark:text-violet-200 rounded-lg hover:bg-violet-50 dark:hover:bg-dpurple-800"
        >
          + 新規
        </button>
      </div>

      {activeDoc && (
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={activeDoc.title}
            onChange={(e) => updateDocument(activeDoc.id, { title: e.target.value })}
            className="px-2 py-1 text-sm bg-transparent border border-transparent hover:border-violet-200 focus:border-violet-400 focus:outline-none rounded w-48 text-violet-900 dark:text-violet-50 dark:hover:border-dpurple-600"
            placeholder="タイトル"
          />
          <button
            onClick={() => setShowPreview(true)}
            className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm"
          >
            コンパイル
          </button>
          <button
            onClick={() => {
              if (confirm(`ドキュメント「${activeDoc.title}」を削除しますか？`)) {
                deleteDocument(activeDoc.id);
              }
            }}
            className="px-2 py-1.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-dpurple-800 rounded-lg"
            title="ドキュメントを削除"
          >
            削除
          </button>
        </div>
      )}

      {showPreview && activeDoc && (
        <CompilePreviewModal
          doc={activeDoc}
          fragments={fragments}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

type PreviewTab = 'document' | 'markdown';

function CompilePreviewModal({
  doc,
  fragments,
  onClose,
}: {
  doc: ReturnType<typeof useFragmentsStore.getState>['documents'][number];
  fragments: ReturnType<typeof useFragmentsStore.getState>['fragments'];
  onClose: () => void;
}) {
  const images = useFragmentsStore((s) => s.images);
  const [tab, setTab] = useState<PreviewTab>('document');
  const [stripLinks, setStripLinks] = useState(true);
  const [includeTitleBlock, setIncludeTitleBlock] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [author, setAuthor] = useState('');

  const markdown = useMemo(
    () => compileDocument(doc, fragments, { stripWikilinks: stripLinks }),
    [doc, fragments, stripLinks]
  );
  const bodyHtml = useMemo(
    () =>
      renderDocumentBody(
        doc,
        fragments,
        {
          stripWikilinks: stripLinks,
          includeTitleBlock,
          includeToc,
          author: author.trim() || undefined,
        },
        images,
      ),
    [doc, fragments, images, stripLinks, includeTitleBlock, includeToc, author]
  );
  const css = useMemo(() => documentCss(), []);

  const handlePdf = () => {
    openPdfPrintWindow(
      doc,
      fragments,
      {
        stripWikilinks: stripLinks,
        includeTitleBlock,
        includeToc,
        author: author.trim() || undefined,
      },
      images,
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dpurple-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-full flex flex-col overflow-hidden animate-scale-in"
      >
        <div className="px-5 py-3 border-b border-violet-200 dark:border-dpurple-700 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-violet-900 dark:text-violet-50 shrink-0">
            コンパイル結果
          </h2>
          <div className="inline-flex rounded-lg bg-cream-100 dark:bg-dpurple-800 ring-[0.5px] ring-black/10 dark:ring-white/10 overflow-hidden">
            <TabButton active={tab === 'document'} onClick={() => setTab('document')}>
              文書プレビュー
            </TabButton>
            <TabButton active={tab === 'markdown'} onClick={() => setTab('markdown')}>
              Markdown
            </TabButton>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 text-xl leading-none px-2"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-2 border-b border-violet-100 dark:border-dpurple-700 flex items-center gap-4 text-sm bg-cream-50 dark:bg-dpurple-900/60 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={stripLinks}
              onChange={(e) => setStripLinks(e.target.checked)}
              className="accent-violet-600"
            />
            <span className="text-gray-700 dark:text-gray-200">[[リンク]] を通常テキストに展開</span>
          </label>
          {tab === 'document' && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTitleBlock}
                  onChange={(e) => setIncludeTitleBlock(e.target.checked)}
                  className="accent-violet-600"
                />
                <span className="text-gray-700 dark:text-gray-200">タイトルページ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeToc}
                  onChange={(e) => setIncludeToc(e.target.checked)}
                  className="accent-violet-600"
                />
                <span className="text-gray-700 dark:text-gray-200">目次</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 dark:text-gray-300">著者</span>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="（任意）"
                  className="px-2 py-1 text-xs rounded-md bg-white dark:bg-dpurple-800 border border-violet-200 dark:border-dpurple-700 focus:outline-none focus:ring-1 focus:ring-violet-400 w-40 text-gray-800 dark:text-gray-100"
                />
              </label>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F5F5F7] dark:bg-dpurple-950 px-4 sm:px-8 py-6 min-h-[320px]">
          {tab === 'document' ? (
            <>
              <style>{css}</style>
              <article
                className="doc-root doc-preview-surface mx-auto"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </>
          ) : (
            <pre className="text-[13px] leading-relaxed whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-100 max-w-4xl mx-auto bg-white dark:bg-dpurple-900 rounded-lg p-4 shadow-sm ring-[0.5px] ring-black/10 dark:ring-white/10">
              {markdown}
            </pre>
          )}
        </div>

        <div className="px-5 py-3 border-t border-violet-200 dark:border-dpurple-700 flex items-center justify-end gap-2 bg-white dark:bg-dpurple-900 flex-wrap">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mr-auto">
            PDF出力はブラウザの印刷ダイアログで「PDFとして保存」を選択してください
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(markdown);
            }}
            className="px-3 py-1.5 text-sm text-violet-700 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-dpurple-700 rounded-lg border border-violet-200 dark:border-dpurple-600"
          >
            Markdown をコピー
          </button>
          <button
            onClick={() => downloadMarkdown(doc.title, markdown)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-dpurple-800 hover:bg-violet-50 dark:hover:bg-dpurple-700 text-violet-700 dark:text-violet-100 rounded-lg border border-violet-200 dark:border-dpurple-600"
          >
            .md でダウンロード
          </button>
          <button
            onClick={handlePdf}
            className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm"
          >
            PDF で出力
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1 text-xs font-semibold transition-colors',
        active
          ? 'bg-violet-600 text-white'
          : 'text-gray-700 dark:text-gray-100 hover:bg-white dark:hover:bg-dpurple-700',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
