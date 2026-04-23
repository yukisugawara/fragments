import { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { TopLeftCluster } from './components/TopLeftCluster';
import { TopRightCluster } from './components/TopRightCluster';
import { Phase1Fragments } from './phases/Phase1Fragments';
import { Phase2Graph } from './phases/Phase2Graph';
import { Phase3QDA } from './phases/Phase3QDA';
import { Phase4Document } from './phases/Phase4Document';
import { useAppStore } from './store/useAppStore';
import { useFragmentsStore } from './store/useFragmentsStore';
import { initAutoSaveFromStorage } from './utils/autoSave';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const theme = useAppStore((s) => s.theme);
  const activePhase = useFragmentsStore((s) => s.activePhase);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    initAutoSaveFromStorage();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div
      className={[
        'h-screen w-screen overflow-hidden animate-fade-in relative',
        phaseTint(activePhase),
      ].join(' ')}
    >
      {activePhase === 1 && <Phase1Fragments />}
      {activePhase === 2 && <Phase2Graph />}
      {activePhase === 3 && <Phase3QDA />}
      {activePhase === 4 && <Phase4Document />}
      <TopLeftCluster />
      <TopRightCluster />
    </div>
  );
}

/**
 * Returns a subtle pastel tint class for the app background per phase.
 * The body itself already has a multi-pastel gradient — the tint layers a
 * phase-specific accent wash so each phase feels distinct but cohesive.
 */
function phaseTint(phase: 1 | 2 | 3 | 4): string {
  switch (phase) {
    case 1:
      return 'app-phase-tint phase-tint-pink';
    case 2:
      return 'app-phase-tint phase-tint-lavender';
    case 3:
      return 'app-phase-tint phase-tint-mint';
    case 4:
      return 'app-phase-tint phase-tint-peach';
  }
}

export default App;
