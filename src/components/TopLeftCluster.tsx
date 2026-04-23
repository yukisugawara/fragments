import { BrandMark } from './BrandMark';
import { DataMenu } from './DataMenu';
import { HelpButton } from './HelpButton';
import { PhaseSwitcher } from './PhaseSwitcher';

export function TopLeftCluster() {
  return (
    <div className="fixed top-3 left-3 z-50 flex items-center gap-2">
      <BrandMark />
      <PhaseSwitcher />
      <DataMenu />
      <HelpButton />
    </div>
  );
}
