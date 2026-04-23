import { useState, useCallback } from 'react';
import { Header } from '../components/Header';
import { DockLayout } from '../components/DockLayout';
import { MapModal } from '../components/MapModal';
import { MethodologyGuide } from '../components/MethodologyGuide';
import { UsageGuide } from '../components/UsageGuide';
import { FragmentImportModal } from '../components/FragmentImportModal';
import type { LayoutNode } from '../utils/layoutTree';
import { DEFAULT_LAYOUT } from '../utils/layoutTree';

export function Phase3QDA() {
  const [showMap, setShowMap] = useState(false);
  const [showFragmentImport, setShowFragmentImport] = useState(false);
  const [layout, setLayout] = useState<LayoutNode>(structuredClone(DEFAULT_LAYOUT));

  const resetLayout = useCallback(() => {
    setLayout(structuredClone(DEFAULT_LAYOUT));
  }, []);

  return (
    <div className="flex flex-col h-full bg-cream-50 dark:bg-dpurple-950 relative">
      <Header onOpenMap={() => setShowMap(true)} onResetLayout={resetLayout} />
      <div className="flex-1 overflow-hidden">
        <DockLayout layout={layout} onLayoutChange={setLayout} />
      </div>

      {/* Floating button to import fragments as QDA files */}
      <button
        onClick={() => setShowFragmentImport(true)}
        className="fixed left-[120px] bottom-4 z-40 flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm font-semibold"
        title="フェーズ1で作成した断片を分析対象として取り込む"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3V13 M3 8H13" />
        </svg>
        断片から追加
      </button>

      {showMap && <MapModal onClose={() => setShowMap(false)} />}
      {showFragmentImport && <FragmentImportModal onClose={() => setShowFragmentImport(false)} />}
      <MethodologyGuide />
      <UsageGuide />
    </div>
  );
}
