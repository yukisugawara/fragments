import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { manualContent } from './helpContent/manual';
import { philosophyContent } from './helpContent/philosophy';

type Tab = 'manual' | 'philosophy';

interface Props {
  onClose: () => void;
}

export function HelpOverlay({ onClose }: Props) {
  const { i18n } = useTranslation();
  const [tab, setTab] = useState<Tab>('manual');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    // reset scroll when switching tab
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  const lang = i18n.language.startsWith('ja') ? 'ja' : 'en';
  const manual = manualContent[lang];
  const philosophy = philosophyContent[lang];
  const current = tab === 'manual' ? manual : philosophy;

  const labels = useMemo(
    () => ({
      manual: lang === 'ja' ? 'マニュアル' : 'Manual',
      philosophy: lang === 'ja' ? '設計思想' : 'Design philosophy',
      close: lang === 'ja' ? '閉じる' : 'Close',
      closeHint: lang === 'ja' ? 'Escキーでも閉じます' : 'Esc to close',
    }),
    [lang]
  );

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={labels.manual + ' / ' + labels.philosophy}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dpurple-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-scale-in ring-1 ring-violet-200 dark:ring-dpurple-600"
      >
        {/* Header with tabs and close */}
        <div className="flex items-center px-4 py-2.5 border-b border-violet-200 dark:border-dpurple-700 bg-cream-50/70 dark:bg-dpurple-900/70 gap-2">
          <div className="flex rounded-lg overflow-hidden ring-1 ring-violet-200 dark:ring-dpurple-600 bg-white dark:bg-dpurple-800">
            <TabButton
              active={tab === 'manual'}
              onClick={() => setTab('manual')}
              label={labels.manual}
            />
            <TabButton
              active={tab === 'philosophy'}
              onClick={() => setTab('philosophy')}
              label={labels.philosophy}
            />
          </div>
          <div className="flex-1" />
          <span className="hidden sm:block text-[11px] text-gray-400 dark:text-gray-500">
            {labels.closeHint}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 text-2xl leading-none px-2 transition-colors"
            aria-label={labels.close}
            title={labels.close}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 prose-help"
        >
          <article>
            <header className="mb-8">
              <div className="text-[10px] uppercase tracking-[0.2em] text-violet-500 font-bold">
                {tab === 'manual' ? labels.manual : labels.philosophy}
              </div>
              <h1 className="mt-2 text-2xl font-bold text-violet-900 dark:text-violet-50">
                {current.title}
              </h1>
              {current.lead && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {current.lead}
                </p>
              )}
            </header>
            {current.sections.map((section, i) => (
              <section key={i} className="mb-8">
                <h2 className="text-lg font-bold text-violet-800 dark:text-violet-200 border-l-4 border-violet-400 pl-3 mb-3">
                  {section.heading}
                </h2>
                {section.body.map((block, j) => {
                  if (block.type === 'p') {
                    return (
                      <p
                        key={j}
                        className="text-[14px] text-gray-700 dark:text-gray-200 leading-relaxed my-3"
                      >
                        {renderInline(block.text)}
                      </p>
                    );
                  }
                  if (block.type === 'h3') {
                    return (
                      <h3
                        key={j}
                        className="mt-5 mb-2 text-[15px] font-semibold text-violet-700 dark:text-violet-100"
                      >
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === 'ul') {
                    return (
                      <ul
                        key={j}
                        className="list-disc pl-6 my-2 text-[14px] text-gray-700 dark:text-gray-200 space-y-1"
                      >
                        {block.items.map((it, k) => (
                          <li key={k} className="leading-relaxed">
                            {renderInline(it)}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === 'callout') {
                    return (
                      <div
                        key={j}
                        className="my-4 rounded-lg bg-violet-50 dark:bg-dpurple-800/60 border-l-4 border-violet-400 px-4 py-3 text-[13.5px] text-violet-900 dark:text-violet-100 leading-relaxed"
                      >
                        {renderInline(block.text)}
                      </div>
                    );
                  }
                  if (block.type === 'quote') {
                    return (
                      <blockquote
                        key={j}
                        className="my-4 pl-4 border-l-2 border-violet-300 dark:border-violet-500 text-[14px] text-gray-600 dark:text-gray-300 italic leading-relaxed"
                      >
                        {renderInline(block.text)}
                        {block.cite && (
                          <div className="mt-1 text-[11px] not-italic text-gray-400">
                            — {block.cite}
                          </div>
                        )}
                      </blockquote>
                    );
                  }
                  return null;
                })}
              </section>
            ))}
            {current.footer && (
              <footer className="mt-10 pt-4 border-t border-violet-100 dark:border-dpurple-700 text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {renderInline(current.footer)}
              </footer>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-violet-600 text-white'
          : 'text-violet-700 dark:text-violet-100 hover:bg-violet-50 dark:hover:bg-dpurple-700',
      ].join(' ')}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

// Render inline text with a very small subset of markdown-like syntax:
// - **bold**
// - `code`
// - [[wikilink]] (styled as emphasis, not clickable here)
function renderInline(text: string) {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\]|https?:\/\/[^\s<>()]+)/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) out.push(text.slice(cursor, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      out.push(
        <strong key={key++} className="font-bold text-violet-900 dark:text-violet-50">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith('`')) {
      out.push(
        <code
          key={key++}
          className="bg-violet-100 dark:bg-dpurple-800 text-violet-800 dark:text-violet-100 px-1.5 py-0.5 rounded text-[0.9em] font-mono"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith('[[')) {
      out.push(
        <span
          key={key++}
          className="text-violet-600 dark:text-violet-200 font-medium bg-violet-50 dark:bg-dpurple-800/50 px-1 rounded"
        >
          {tok.slice(2, -2)}
        </span>
      );
    } else if (tok.startsWith('http')) {
      out.push(
        <a
          key={key++}
          href={tok}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 dark:text-violet-300 underline decoration-violet-400/40 underline-offset-2 hover:decoration-violet-600 break-all"
        >
          {tok}
        </a>
      );
    }
    cursor = m.index + tok.length;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}
