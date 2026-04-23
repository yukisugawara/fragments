import { useEffect } from 'react';
import { FragmentList } from './FragmentList';
import { FragmentEditor } from './FragmentEditor';
import { FragmentPreview } from './FragmentPreview';
import { useFragmentsStore } from '../../store/useFragmentsStore';

export function Phase1Fragments() {
  const fragments = useFragmentsStore((s) => s.fragments);
  const activeFragmentId = useFragmentsStore((s) => s.activeFragmentId);
  const setActive = useFragmentsStore((s) => s.setActiveFragmentId);

  useEffect(() => {
    if (!activeFragmentId && fragments.length > 0) {
      setActive(fragments[0].id);
    }
  }, [activeFragmentId, fragments, setActive]);

  return (
    <div className="h-full grid" style={{ gridTemplateColumns: '260px 1fr 1fr' }}>
      <FragmentList />
      <FragmentEditor />
      <div className="border-l border-violet-200/60 dark:border-dpurple-700/60 overflow-hidden">
        <FragmentPreview />
      </div>
    </div>
  );
}
