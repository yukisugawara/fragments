import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFragmentsStore } from '../store/useFragmentsStore';
import { useAppStore, type Code } from '../store/useAppStore';
import { parseWikilinks, appendWikilink } from '../utils/wikilinks';
import { forceLayout, type Position } from '../utils/forceLayout';

const GHOST_PREFIX = 'ghost:';

type ColorMode = 'uniform' | 'code' | 'degree';
const COLOR_MODE_STORAGE_KEY = 'fragments.phase2.colorMode';

/* ------------------------------------------------------------------ */
/* Graph structure (node ids + raw edges) derived from fragment content */
/* ------------------------------------------------------------------ */
interface Structure {
  nodeIds: string[];
  ghostTitles: string[];
  fragmentById: Map<string, { id: string; title: string }>;
  rawEdges: Array<{ source: string; target: string }>;
}

function buildStructure(fragments: { id: string; title: string; content: string }[]): Structure {
  const fragmentById = new Map<string, { id: string; title: string }>();
  fragments.forEach((f) => fragmentById.set(f.id, { id: f.id, title: f.title }));
  const byTitle = new Map(fragments.map((f) => [f.title.toLowerCase(), f]));
  const rawEdges: Array<{ source: string; target: string }> = [];
  const ghostTitleSet = new Map<string, string>();
  for (const f of fragments) {
    for (const l of parseWikilinks(f.content)) {
      const key = l.target.toLowerCase();
      const existing = byTitle.get(key);
      if (existing) {
        if (existing.id !== f.id) rawEdges.push({ source: f.id, target: existing.id });
      } else {
        if (!ghostTitleSet.has(key)) ghostTitleSet.set(key, l.target);
        rawEdges.push({ source: f.id, target: `${GHOST_PREFIX}${key}` });
      }
    }
  }
  const ghostTitles = Array.from(ghostTitleSet.values());
  const nodeIds = [
    ...fragments.map((f) => f.id),
    ...ghostTitles.map((t) => `${GHOST_PREFIX}${t.toLowerCase()}`),
  ];
  return { nodeIds, ghostTitles, fragmentById, rawEdges };
}

/* ------------------------------------------------------------------ */
/* Color maps for each mode                                            */
/* ------------------------------------------------------------------ */
interface CodeColorInfo {
  /** fragmentId → category color (top-level group color, picked from dominant category) */
  byFragment: Map<string, { color: string; categoryName: string }>;
  /** Legend: category id → { name, color, count } */
  legend: Array<{ id: string; name: string; color: string; count: number }>;
}

function buildCodeColorMap(codes: Code[]): CodeColorInfo {
  // Groups (categories) are codes with parentId === null.
  const groups = new Map<string, { name: string; color: string }>();
  for (const c of codes) {
    if (c.parentId === null) {
      groups.set(c.id, { name: c.text, color: c.color });
    }
  }

  // For each fragment (fileId), count codes per category (walking up parentId chain to the root group).
  const byFragment = new Map<string, { color: string; categoryName: string }>();
  const fragmentCategoryCount = new Map<string, Map<string, number>>(); // fileId → catId → count
  const parentOf = new Map<string, string | null>();
  for (const c of codes) parentOf.set(c.id, c.parentId);

  const rootOf = (codeId: string): string | null => {
    let cur: string | null = codeId;
    for (let i = 0; i < 20 && cur !== null; i++) {
      const p = parentOf.get(cur) ?? null;
      if (p === null) return cur; // cur is a root group
      cur = p;
    }
    return null;
  };

  for (const c of codes) {
    if (c.parentId === null) continue; // groups themselves aren't coded ranges
    if (!c.fileId) continue;
    const root = rootOf(c.id);
    if (!root || !groups.has(root)) continue;
    let catMap = fragmentCategoryCount.get(c.fileId);
    if (!catMap) {
      catMap = new Map();
      fragmentCategoryCount.set(c.fileId, catMap);
    }
    catMap.set(root, (catMap.get(root) ?? 0) + 1);
  }

  for (const [fileId, catMap] of fragmentCategoryCount) {
    let best: { id: string; count: number } | null = null;
    for (const [catId, count] of catMap) {
      if (!best || count > best.count) best = { id: catId, count };
    }
    if (best) {
      const g = groups.get(best.id)!;
      byFragment.set(fileId, { color: g.color, categoryName: g.name });
    }
  }

  // Build legend: for each group, count fragments using it as dominant.
  const domUsage = new Map<string, number>();
  for (const { categoryName } of byFragment.values()) {
    // use name as key via resolved group
  }
  const catToFragCount = new Map<string, number>();
  for (const [, info] of byFragment) {
    // count by color? easier to re-derive from groups directly
    void info;
  }
  // Count per category id
  for (const [, catMap] of fragmentCategoryCount) {
    let best: { id: string; count: number } | null = null;
    for (const [catId, count] of catMap) {
      if (!best || count > best.count) best = { id: catId, count };
    }
    if (best) {
      catToFragCount.set(best.id, (catToFragCount.get(best.id) ?? 0) + 1);
    }
  }
  const legend: CodeColorInfo['legend'] = [];
  for (const [id, g] of groups) {
    const count = catToFragCount.get(id) ?? 0;
    if (count > 0) legend.push({ id, name: g.name, color: g.color, count });
  }
  legend.sort((a, b) => b.count - a.count);

  return { byFragment, legend };
}

interface DegreeColorInfo {
  byFragment: Map<string, { color: string; degree: number }>;
  maxDegree: number;
}

function buildDegreeColorMap(
  nodeIds: string[],
  rawEdges: Array<{ source: string; target: string }>
): DegreeColorInfo {
  const degree = new Map<string, number>();
  for (const id of nodeIds) degree.set(id, 0);
  for (const e of rawEdges) {
    // Count both source and target contributions (total degree)
    if (degree.has(e.source)) degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    if (degree.has(e.target)) degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  let maxDegree = 0;
  for (const v of degree.values()) if (v > maxDegree) maxDegree = v;
  const byFragment = new Map<string, { color: string; degree: number }>();
  for (const [id, d] of degree) {
    if (id.startsWith(GHOST_PREFIX)) continue;
    const t = maxDegree > 0 ? d / maxDegree : 0;
    byFragment.set(id, { color: degreeColor(t), degree: d });
  }
  return { byFragment, maxDegree };
}

// 3-stop color interpolation: cool → mid → warm
function degreeColor(t: number): string {
  // stops: #D8D8DE → #6F66D3 → #FF9F59
  const stops = [
    [216, 216, 222],
    [111, 102, 211],
    [255, 159, 89],
  ];
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (stops.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const a = stops[idx];
  const b = stops[Math.min(idx + 1, stops.length - 1)];
  const r = Math.round(a[0] + (b[0] - a[0]) * frac);
  const g = Math.round(a[1] + (b[1] - a[1]) * frac);
  const bl = Math.round(a[2] + (b[2] - a[2]) * frac);
  return `rgb(${r}, ${g}, ${bl})`;
}

/* ------------------------------------------------------------------ */
/* Node / edge style builders                                          */
/* ------------------------------------------------------------------ */
function fragmentNodeStyle(accent: string, tinted = true): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 10,
    background: tinted ? tintBackground(accent) : 'white',
    border: `1.5px solid ${accent}`,
    color: '#1D1D1F',
    fontSize: 12,
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
    minWidth: 90,
    textAlign: 'center',
    cursor: 'grab',
  };
}

function tintBackground(color: string): string {
  // Soft tinted fill — use color at ~12% alpha, on top of white
  // For rgb() input: convert to rgba with alpha 0.12 on white backing.
  if (color.startsWith('rgb(')) {
    const rgba = color.replace('rgb(', 'rgba(').replace(')', ', 0.12)');
    return `linear-gradient(0deg, ${rgba}, ${rgba}), #FFFFFF`;
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const bigint = parseInt(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `linear-gradient(0deg, rgba(${r},${g},${b},0.12), rgba(${r},${g},${b},0.12)), #FFFFFF`;
  }
  return '#FFFFFF';
}

function ghostNodeStyle(): React.CSSProperties {
  return {
    padding: '7px 12px',
    borderRadius: 10,
    background: 'transparent',
    border: '1.5px dashed rgba(111, 102, 211, 0.55)',
    color: 'rgba(76, 67, 171, 0.8)',
    fontSize: 11,
    fontStyle: 'italic',
    minWidth: 90,
    textAlign: 'center',
    opacity: 0.8,
    cursor: 'default',
  };
}

function edgeStyle(): React.CSSProperties {
  return { stroke: 'rgba(111, 102, 211, 0.55)', strokeWidth: 1.4 };
}

const DEFAULT_ACCENT = '#6F66D3';

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export function Phase2Graph() {
  const { t } = useTranslation();
  const fragments = useFragmentsStore((s) => s.fragments);
  const updateFragment = useFragmentsStore((s) => s.updateFragment);
  const setActive = useFragmentsStore((s) => s.setActiveFragmentId);
  const setPhase = useFragmentsStore((s) => s.setActivePhase);
  const qdaCodes = useAppStore((s) => s.codes);

  const positionsRef = useRef<Map<string, Position>>(new Map());
  const [layoutVersion, setLayoutVersion] = useState(0);
  const relayout = useCallback(() => {
    positionsRef.current = new Map();
    setLayoutVersion((v) => v + 1);
  }, []);

  const structure = useMemo(() => buildStructure(fragments), [fragments]);

  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    try {
      const saved = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
      if (saved === 'uniform' || saved === 'code' || saved === 'degree') return saved;
    } catch {
      /* ignore */
    }
    return 'uniform';
  });
  useEffect(() => {
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
    } catch {
      /* ignore */
    }
  }, [colorMode]);

  const codeColor = useMemo(() => buildCodeColorMap(qdaCodes), [qdaCodes]);
  const degreeColor = useMemo(
    () => buildDegreeColorMap(structure.nodeIds, structure.rawEdges),
    [structure]
  );

  /* --- Force layout (cached across renders; only runs for new nodes) --- */
  const layoutPositions = useMemo(() => {
    const known = new Map(positionsRef.current);
    const anyMissing = structure.nodeIds.some((id) => !known.has(id));
    if (!anyMissing && known.size >= structure.nodeIds.length) return known;
    const layout = forceLayout(
      structure.nodeIds.map((id) => ({ id })),
      structure.rawEdges,
      { seed: known, iterations: known.size === 0 ? 360 : 180 }
    );
    positionsRef.current = layout;
    return layout;
    // layoutVersion is included so user-triggered relayout re-runs this memo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structure, layoutVersion]);

  /* --- Compose nodes with per-mode colors --- */
  const computedNodes = useMemo<Node[]>(() => {
    const out: Node[] = [];
    for (const id of structure.nodeIds) {
      const isGhost = id.startsWith(GHOST_PREFIX);
      const pos = layoutPositions.get(id) ?? { x: 0, y: 0 };
      if (isGhost) {
        const title = structure.ghostTitles.find(
          (tt) => `${GHOST_PREFIX}${tt.toLowerCase()}` === id
        );
        out.push({
          id,
          data: { label: `${title ?? ''} ${t('phase2.ghostSuffix')}` },
          position: pos,
          style: ghostNodeStyle(),
          draggable: true,
          connectable: false,
          selectable: false,
        });
        continue;
      }

      const frag = structure.fragmentById.get(id);
      let accent = DEFAULT_ACCENT;
      let tinted = false;
      if (colorMode === 'code') {
        const info = codeColor.byFragment.get(id);
        if (info) {
          accent = info.color;
          tinted = true;
        } else {
          accent = '#D8D8DE';
        }
      } else if (colorMode === 'degree') {
        const info = degreeColor.byFragment.get(id);
        if (info) {
          accent = info.color;
          tinted = true;
        }
      }
      out.push({
        id,
        data: { label: frag?.title ?? id },
        position: pos,
        style: fragmentNodeStyle(accent, tinted),
      });
    }
    return out;
  }, [structure, layoutPositions, t, colorMode, codeColor, degreeColor]);

  const computedEdges = useMemo<Edge[]>(() => {
    return structure.rawEdges.map((e, idx) => ({
      id: `e-${idx}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      style: edgeStyle(),
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6F66D3' },
    }));
  }, [structure]);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<Node>(computedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(computedEdges);

  useEffect(() => {
    setNodes(computedNodes);
    setEdges(computedEdges);
  }, [computedNodes, computedEdges, setNodes, setEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeBase(changes);
      setNodes((current) => {
        const next = applyNodeChanges(changes, current);
        for (const n of next) {
          positionsRef.current.set(n.id, { x: n.position.x, y: n.position.y });
        }
        return next;
      });
    },
    [onNodesChangeBase, setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source.startsWith(GHOST_PREFIX) || params.target.startsWith(GHOST_PREFIX)) return;
      if (params.source === params.target) return;
      const srcFrag = fragments.find((f) => f.id === params.source);
      const tgtFrag = fragments.find((f) => f.id === params.target);
      if (!srcFrag || !tgtFrag) return;
      const newContent = appendWikilink(srcFrag.content, tgtFrag.title);
      if (newContent === srcFrag.content) return;
      updateFragment(srcFrag.id, { content: newContent });
    },
    [fragments, updateFragment]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const filtered = changes.filter((c) => c.type !== 'remove');
      onEdgesChange(filtered);
    },
    [onEdgesChange]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith(GHOST_PREFIX)) return;
      setActive(node.id);
      setPhase(1);
    },
    [setActive, setPhase]
  );

  const fragmentCount = structure.fragmentById.size;
  const edgeCount = structure.rawEdges.length;

  return (
    <div className="h-full w-full bg-cream-50 dark:bg-dpurple-950 relative">
      {fragmentCount === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-2">
          <div className="text-base">{t('phase2.emptyTitle')}</div>
          <button
            onClick={() => setPhase(1)}
            className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            {t('phase2.goToPhase1')}
          </button>
        </div>
      ) : (
        <>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodesDraggable
            nodesConnectable
            elementsSelectable
            fitView
            fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              style: edgeStyle(),
              markerEnd: { type: MarkerType.ArrowClosed, color: '#6F66D3' },
            }}
            connectionLineStyle={{ stroke: '#6F66D3', strokeWidth: 1.6, strokeDasharray: '4 3' }}
          >
            <Background gap={24} size={1} color="rgba(0,0,0,0.06)" />
            <Controls className="!bg-white/90 !shadow-md !ring-[0.5px] !ring-black/10" />
            <MiniMap
              position="top-right"
              pannable
              zoomable
              nodeColor={(n) => {
                if (n.id.startsWith(GHOST_PREFIX)) return '#B5ABEF';
                if (colorMode === 'code') return codeColor.byFragment.get(n.id)?.color ?? '#D8D8DE';
                if (colorMode === 'degree') return degreeColor.byFragment.get(n.id)?.color ?? '#D8D8DE';
                return '#6F66D3';
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                border: '0.5px solid rgba(0,0,0,0.1)',
                borderRadius: 10,
              }}
            />
          </ReactFlow>

          <div className="absolute top-[64px] left-4 flex flex-col gap-2 max-w-[380px]">
            <div className="px-3 py-1.5 bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] ring-[0.5px] ring-black/10 dark:ring-white/10 text-[11px] text-gray-700 dark:text-gray-200 whitespace-nowrap pointer-events-none">
              {t('phase2.statusBar', { fragments: fragmentCount, edges: edgeCount })}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ColorModeControl mode={colorMode} setMode={setColorMode} />
              <button
                onClick={relayout}
                className="px-2.5 py-1 text-[11px] font-medium bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl rounded-lg shadow-sm ring-[0.5px] ring-black/10 dark:ring-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dpurple-800 transition-colors"
                title={t('phase2.relayoutTooltip')}
              >
                ↻ {t('phase2.relayout')}
              </button>
            </div>

            {colorMode === 'code' && codeColor.legend.length > 0 && (
              <CodeLegend legend={codeColor.legend} />
            )}
            {colorMode === 'code' && codeColor.legend.length === 0 && (
              <LegendCard>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('phase2.codeLegendEmpty')}
                </div>
              </LegendCard>
            )}
            {colorMode === 'degree' && (
              <DegreeLegend maxDegree={degreeColor.maxDegree} />
            )}

            <div className="px-3 py-1.5 bg-white/80 dark:bg-dpurple-900/80 backdrop-blur-xl rounded-lg shadow-sm ring-[0.5px] ring-black/10 dark:ring-white/10 text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed pointer-events-none">
              {t('phase2.hints')}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auxiliary UI                                                        */
/* ------------------------------------------------------------------ */
function ColorModeControl({
  mode,
  setMode,
}: {
  mode: ColorMode;
  setMode: (m: ColorMode) => void;
}) {
  const { t } = useTranslation();
  const options: Array<{ id: ColorMode; label: string }> = [
    { id: 'uniform', label: t('phase2.colorMode.uniform') },
    { id: 'code', label: t('phase2.colorMode.code') },
    { id: 'degree', label: t('phase2.colorMode.degree') },
  ];
  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0 text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold">
        {t('phase2.colorMode.label')}
      </div>
      <div className="inline-flex bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl rounded-lg shadow-sm ring-[0.5px] ring-black/10 dark:ring-white/10 overflow-hidden">
        {options.map((o) => {
          const active = o.id === mode;
          return (
            <button
              key={o.id}
              onClick={() => setMode(o.id)}
              className={[
                'px-2.5 py-1 text-[11px] font-medium transition-colors',
                active
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dpurple-800',
              ].join(' ')}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LegendCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl rounded-lg shadow-sm ring-[0.5px] ring-black/10 dark:ring-white/10">
      {children}
    </div>
  );
}

function CodeLegend({
  legend,
}: {
  legend: Array<{ id: string; name: string; color: string; count: number }>;
}) {
  const { t } = useTranslation();
  return (
    <LegendCard>
      <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold mb-1">
        {t('phase2.colorMode.codeLegendTitle')}
      </div>
      <ul className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
        {legend.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-200"
          >
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ backgroundColor: c.color, border: '0.5px solid rgba(0,0,0,0.15)' }}
            />
            <span className="flex-1 truncate">{c.name}</span>
            <span className="text-gray-400 text-[10px]">{c.count}</span>
          </li>
        ))}
      </ul>
    </LegendCard>
  );
}

function DegreeLegend({ maxDegree }: { maxDegree: number }) {
  const { t } = useTranslation();
  const gradient =
    'linear-gradient(90deg, rgb(216,216,222) 0%, rgb(111,102,211) 50%, rgb(255,159,89) 100%)';
  return (
    <LegendCard>
      <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold mb-1">
        {t('phase2.colorMode.degreeLegendTitle')}
      </div>
      <div
        className="h-2 rounded-full"
        style={{ background: gradient, border: '0.5px solid rgba(0,0,0,0.08)' }}
      />
      <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
        <span>0</span>
        <span>{Math.ceil(maxDegree / 2)}</span>
        <span>{maxDegree}</span>
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">
        {t('phase2.colorMode.degreeHint')}
      </div>
    </LegendCard>
  );
}
