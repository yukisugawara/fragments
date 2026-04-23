import { useTranslation } from 'react-i18next';
import { useFragmentsStore, type Phase } from '../store/useFragmentsStore';

interface PhaseMeta {
  id: Phase;
  labelKey: string;
  sublabelKey: string;
}

const PHASES: PhaseMeta[] = [
  { id: 1, labelKey: 'phaseSwitcher.phases.p1label', sublabelKey: 'phaseSwitcher.phases.p1sub' },
  { id: 2, labelKey: 'phaseSwitcher.phases.p2label', sublabelKey: 'phaseSwitcher.phases.p2sub' },
  { id: 3, labelKey: 'phaseSwitcher.phases.p3label', sublabelKey: 'phaseSwitcher.phases.p3sub' },
  { id: 4, labelKey: 'phaseSwitcher.phases.p4label', sublabelKey: 'phaseSwitcher.phases.p4sub' },
];

export function PhaseSwitcher() {
  const { t } = useTranslation();
  const activePhase = useFragmentsStore((s) => s.activePhase);
  const setActivePhase = useFragmentsStore((s) => s.setActivePhase);

  const activeMeta = PHASES.find((p) => p.id === activePhase)!;

  return (
    <div
      className="flex items-center gap-1.5 pl-1.5 pr-3 py-1 bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] ring-[0.5px] ring-black/10 dark:ring-white/10 rounded-full select-none"
      role="navigation"
      aria-label={t('phaseSwitcher.aria')}
    >
      <div className="flex items-center gap-0.5" role="tablist">
        {PHASES.map((p) => {
          const active = p.id === activePhase;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePhase(p.id)}
              className={[
                'flex items-center justify-center rounded-full font-bold transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                active
                  ? 'w-6 h-6 text-[11px] bg-violet-600 text-white shadow ring-2 ring-white dark:ring-dpurple-900'
                  : 'w-5 h-5 text-[10px] bg-violet-50 dark:bg-dpurple-800 text-violet-700 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-dpurple-700',
              ].join(' ')}
              title={`${t(p.labelKey)}：${t(p.sublabelKey)}`}
              aria-label={`${t(p.labelKey)}：${t(p.sublabelKey)}`}
              aria-current={active ? 'step' : undefined}
            >
              {p.id}
            </button>
          );
        })}
      </div>
      <div className="flex items-baseline gap-1 pl-1 whitespace-nowrap">
        <span className="text-[9px] uppercase tracking-[0.15em] text-violet-500/80 dark:text-violet-300/70 font-semibold">
          P{activeMeta.id}
        </span>
        <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
          {t(activeMeta.labelKey)}
        </span>
      </div>
    </div>
  );
}
