import { useFragmentsStore } from '../store/useFragmentsStore';

const ANGLES = [-90, 0, 90, 180];
const R = 5.5;

function polar(angleDeg: number, r = R) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

export function BrandMark() {
  const setActivePhase = useFragmentsStore((s) => s.setActivePhase);
  return (
    <button
      type="button"
      onClick={() => setActivePhase(1)}
      className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-dpurple-900/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] ring-[0.5px] ring-black/10 dark:ring-white/10 rounded-full select-none hover:bg-white dark:hover:bg-dpurple-900 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      aria-label="fragments — フェーズ1へ戻る"
      title="フェーズ1へ戻る"
    >
      <svg
        viewBox="-8 -8 16 16"
        width="16"
        height="16"
        aria-hidden
        className="shrink-0"
      >
        {/* Arcs connecting the 4 dots into a loop */}
        {ANGLES.map((from, i) => {
          const to = ANGLES[(i + 1) % ANGLES.length];
          const a1 = polar(from + 22);
          const a2 = polar(to - 22);
          return (
            <path
              key={`arc-${i}`}
              d={`M ${a1.x} ${a1.y} A ${R} ${R} 0 0 1 ${a2.x} ${a2.y}`}
              stroke="#B5ABEF"
              strokeWidth={0.8}
              fill="none"
            />
          );
        })}
        {/* 4 dots */}
        {ANGLES.map((a, i) => {
          const { x, y } = polar(a);
          return <circle key={`dot-${i}`} cx={x} cy={y} r={1.7} fill="#6F66D3" />;
        })}
      </svg>
      <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
        fragments
      </span>
    </button>
  );
}
