import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SplashScreenProps {
  onFinish: () => void;
}

type Stage = 'scattered' | 'aligned' | 'connected' | 'named' | 'fading';

const NODE_COUNT = 4;
// Final positions around a circle (N, E, S, W — clockwise)
const FINAL_ANGLES = [-90, 0, 90, 180];
const RADIUS = 60;

// Extra ambient dots that drift in softly behind the main four
const AMBIENT_COUNT = 10;

function buildAmbient(seed = 1) {
  // deterministic pseudo-random to avoid layout shifts between renders
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s & 0x7fffffff) / 2147483647;
  };
  return Array.from({ length: AMBIENT_COUNT }, (_, i) => {
    const r = 35 + rand() * 80;
    const a = rand() * Math.PI * 2;
    return {
      id: i,
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      size: 1.4 + rand() * 1.6,
      delay: 0.1 + rand() * 0.8,
      drift: 6 + rand() * 14,
    };
  });
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [stage, setStage] = useState<Stage>('scattered');
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith('ja') ? 'ja' : 'en';
  const ambient = useMemo(() => buildAmbient(7), []);

  useEffect(() => {
    const t1 = setTimeout(() => setStage('aligned'), 280);
    const t2 = setTimeout(() => setStage('connected'), 1050);
    const t3 = setTimeout(() => setStage('named'), 1700);
    const t4 = setTimeout(() => setStage('fading'), 3000);
    const t5 = setTimeout(() => onFinish(), 3700);
    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
    };
  }, [onFinish]);

  const isConnected = stage === 'connected' || stage === 'named' || stage === 'fading';
  const isNamed = stage === 'named' || stage === 'fading';
  const isAligned = stage !== 'scattered';
  const isFading = stage === 'fading';

  const tagline =
    lang === 'ja'
      ? 'フィールドノート  ·  つながり  ·  コーディング  ·  民族誌'
      : 'fieldnotes  ·  links  ·  coding  ·  ethnography';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-cream-50 dark:bg-dpurple-950"
      style={{
        opacity: isFading ? 0 : 1,
        transition: 'opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      {/* Soft radial wash — mood, not decoration */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(111,102,211,0.10) 0%, rgba(111,102,211,0.04) 30%, transparent 65%)',
        }}
      />

      <div className="relative" style={{ width: 280, height: 280 }}>
        <svg
          viewBox="-140 -140 280 280"
          width={280}
          height={280}
          className="absolute inset-0 overflow-visible"
          aria-hidden
        >
          <defs>
            <radialGradient id="splash-node-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="70%" stopColor="#8F85E0" stopOpacity="1" />
              <stop offset="100%" stopColor="#5E54C4" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="splash-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8F85E0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#B5ABEF" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Ambient drifting dots (background layer) */}
          {ambient.map((a) => (
            <circle
              key={a.id}
              cx={0}
              cy={0}
              r={a.size}
              fill="#6F66D3"
              style={{
                transform: isAligned
                  ? `translate(${a.x}px, ${a.y}px)`
                  : `translate(${a.x * 0.3}px, ${a.y * 0.3}px)`,
                opacity: isAligned ? (isFading ? 0 : 0.35) : 0,
                transition: `transform 1800ms cubic-bezier(0.16,1,0.3,1) ${a.delay}s, opacity 900ms ease ${a.delay}s`,
              }}
            />
          ))}

          {/* Four arcs forming a cyclic loop 1→2→3→4→1 */}
          {FINAL_ANGLES.map((from, i) => {
            const to = FINAL_ANGLES[(i + 1) % NODE_COUNT];
            const a1 = polar(from + 16);
            const a2 = polar(to - 16);
            // Arc length ~ Math.PI/2 * radius ≈ 94px; use a large dasharray for animation
            const PATH_LEN = 120;
            return (
              <path
                key={i}
                d={`M ${a1.x} ${a1.y} A ${RADIUS} ${RADIUS} 0 0 1 ${a2.x} ${a2.y}`}
                fill="none"
                stroke="url(#splash-arc-grad)"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeDasharray={PATH_LEN}
                strokeDashoffset={isConnected ? 0 : PATH_LEN}
                style={{
                  transition: `stroke-dashoffset 900ms cubic-bezier(0.65, 0, 0.35, 1) ${
                    i * 180
                  }ms`,
                  opacity: isConnected ? (isFading ? 0 : 1) : 0,
                }}
              />
            );
          })}

          {/* Four primary fragment nodes */}
          {FINAL_ANGLES.map((angle, i) => {
            const final = polar(angle);
            const initial = getInitial(i);
            const delay = i * 120;
            return (
              <g key={angle}>
                {/* Glow */}
                <circle
                  cx={0}
                  cy={0}
                  r={14}
                  fill="#8F85E0"
                  style={{
                    transform: isAligned
                      ? `translate(${final.x}px, ${final.y}px)`
                      : `translate(${initial.x}px, ${initial.y}px) scale(0.6)`,
                    opacity: isAligned ? (isFading ? 0 : 0.18) : 0,
                    filter: 'blur(6px)',
                    transition: `transform 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 700ms ease ${delay}ms`,
                  }}
                />
                {/* Node core */}
                <circle
                  cx={0}
                  cy={0}
                  r={6}
                  fill="url(#splash-node-grad)"
                  style={{
                    transform: isAligned
                      ? `translate(${final.x}px, ${final.y}px)`
                      : `translate(${initial.x}px, ${initial.y}px) scale(0.4)`,
                    opacity: isAligned ? (isFading ? 0.1 : 1) : 0,
                    transition: `transform 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 700ms ease ${delay}ms`,
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Wordmark at center */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
        >
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 38,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#1D1D1F',
              opacity: isNamed ? (isFading ? 0 : 1) : 0,
              transform: isNamed ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 700ms ease, transform 700ms cubic-bezier(0.16,1,0.3,1)',
            }}
            className="dark:!text-gray-100"
          >
            fragments
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              marginTop: 10,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.16em',
              color: '#6E6E73',
              textTransform: 'uppercase',
              opacity: isNamed ? (isFading ? 0 : 1) : 0,
              transform: isNamed ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 700ms ease 180ms, transform 700ms cubic-bezier(0.16,1,0.3,1) 180ms',
            }}
            className="dark:!text-gray-400"
          >
            {tagline}
          </div>
        </div>
      </div>
    </div>
  );
}

function polar(angleDeg: number, r = RADIUS) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

// Scattered starting positions (deliberately irregular so it feels organic)
function getInitial(i: number) {
  const layout = [
    { x: -95, y: -70 },
    { x: 110, y: -40 },
    { x: -50, y: 100 },
    { x: 90, y: 80 },
  ];
  return layout[i] ?? { x: 0, y: 0 };
}
