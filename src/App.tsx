import { useEffect } from 'react';

import { MethodologyTab } from './components/dashboard/MethodologyTab';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { ProjectionsTab } from './components/dashboard/ProjectionsTab';
import { PreviewBanner } from './components/dashboard/PreviewBanner';
import { ScenariosTab } from './components/dashboard/ScenariosTab';
import { AssumptionRail } from './components/layout/AssumptionRail';
import { RailDrawer } from './components/layout/RailDrawer';
import { MobileRailTrigger, TopBar } from './components/layout/TopBar';
import { Icon } from './components/ui/Icon';
import { useModel } from './state/store';
import { useToast } from './state/toast';

function Toast() {
  const { message, tone, closing } = useToast();
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print pointer-events-none fixed bottom-[4.75rem] left-1/2 z-50 -translate-x-1/2 lg:bottom-6"
    >
      <div
        className={`flex items-center gap-2 rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm text-fg shadow-[var(--shadow-overlay)] ${
          closing ? 'fade-out' : 'fade-in'
        }`}
      >
        <Icon name={tone === 'error' ? 'warning' : 'check'} size={14} className={tone === 'error' ? 'text-danger' : 'text-success'} />
        {message}
      </div>
    </div>
  );
}

export function App() {
  const { tab } = useModel();

  // A new view starts at the top; without this you land mid-page on the next tab.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [tab]);

  return (
    <div id="top" className="min-h-dvh bg-bg">
      <h1 className="sr-only">SaaS Calculator</h1>
      <TopBar />
      <PreviewBanner />

      <div className="mx-auto flex w-full max-w-[1500px] items-start">
        <aside className="sticky top-[var(--header-h)] hidden h-[calc(100dvh-var(--header-h))] w-[336px] shrink-0 overflow-hidden border-r border-line lg:block">
          <AssumptionRail />
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 lg:px-6 lg:pb-16 lg:pt-8">
          {tab === 'overview' ? <OverviewTab /> : null}
          {tab === 'projections' ? <ProjectionsTab /> : null}
          {tab === 'scenarios' ? <ScenariosTab /> : null}
          {tab === 'methodology' ? <MethodologyTab /> : null}
        </main>
      </div>

      <RailDrawer />
      <MobileRailTrigger />
      <Toast />
    </div>
  );
}
