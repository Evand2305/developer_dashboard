import { useState } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import WidgetGrid from '@/components/dashboard/WidgetGrid';
import AddWidgetModal from '@/components/dashboard/AddWidgetModal';
import { useWidgets } from '@/hooks/useWidgets';
import '@/styles/components/dashboard.scss';

export default function DashboardPage() {
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [gridKey, setGridKey] = useState(0);
  const {
    widgets,
    loading,
    addWidget,
    updateWidgetPosition,
    batchUpdatePositions,
    updateWidgetConfig,
    resetWidgets,
    removeWidget,
  } = useWidgets();

  async function handleReset() {
    await resetWidgets();
    setGridKey((k) => k + 1);
  }

  return (
    <DashboardShell onAddWidget={() => setAddWidgetOpen(true)} onReset={handleReset}>
      <WidgetGrid
        key={gridKey}
        widgets={widgets}
        loading={loading}
        onUpdatePosition={updateWidgetPosition}
        onUpdateConfig={updateWidgetConfig}
        onBatchUpdatePositions={batchUpdatePositions}
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
