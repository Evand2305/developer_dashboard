// Layout wrapper: renders the fixed header and the scrollable main content area.
import type { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';

interface Props {
  children: ReactNode;
  onAddWidget: () => void;
  onReset: () => void;
}

export default function DashboardShell({ children, onAddWidget, onReset }: Props) {
  return (
    <div className="dashboard-shell">
      <DashboardHeader onAddWidget={onAddWidget} onReset={onReset} />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
