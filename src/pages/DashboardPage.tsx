import { useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import WidgetGrid from '@/components/dashboard/WidgetGrid';
import AddWidgetModal from '@/components/dashboard/AddWidgetModal';
import { useWidgets } from '@/hooks/useWidgets';
import '@/styles/components/dashboard.scss';

export default function DashboardPage() {
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const { widgets, loading, addWidget, updateWidgetPosition, updateWidgetConfig, removeWidget } = useWidgets();

  return (
    <DashboardShell onAddWidget={() => setAddWidgetOpen(true)}>
      <WidgetGrid
        widgets={widgets}
        loading={loading}
        onUpdatePosition={updateWidgetPosition}
        onUpdateConfig={updateWidgetConfig}
        onRemove={removeWidget}
      />
      <AddWidgetModal
        open={addWidgetOpen}
        onClose={() => setAddWidgetOpen(false)}
        onAdd={addWidget}
      />
    </DashboardShell>
  );
}
