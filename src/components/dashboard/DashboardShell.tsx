import type { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';

interface Props {
  children: ReactNode;
  onAddWidget: () => void;
}

export default function DashboardShell({ children, onAddWidget }: Props) {
  return (
    <div className="dashboard-shell">
      <DashboardHeader onAddWidget={onAddWidget} />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
