// Modal listing all available widget types. Closes on Escape key or overlay click.
// Adding a widget calls onAdd then immediately closes the modal.
import { useEffect }     from 'react';
import type { WidgetType } from '@/types/widget';
import '@/styles/components/modal.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => Promise<void>;
}

// Central list of all widget definitions shown in the picker.
// Add a new entry here whenever a new widget type is created.
const WIDGET_OPTIONS: { type: WidgetType; label: string; description: string; icon: string }[] = [
  { type: 'github',     label: 'GitHub Activity',  description: 'Recent commits, pull requests, and repo activity',  icon: 'GH' },
  { type: 'leetcode',   label: 'LeetCode',          description: 'Problems solved and recent submission activity',     icon: 'LC' },
  { type: 'notes',      label: 'Notes',             description: 'Quick notes synced to the cloud',                   icon: '##' },
  { type: 'calculator', label: 'Calculator',        description: 'Standard calculator with basic arithmetic',         icon: '±'  },
  { type: 'converter',  label: 'Base Converter',    description: 'Convert between hex, decimal, and binary',         icon: '01' },
  { type: 'colorcode',  label: 'Color Identifier',  description: 'Convert a hex color to RGB and HSL',               icon: '#'  },
  { type: 'quicklinks', label: 'Quick Links',       description: 'Save and open your favourite links',               icon: '🔗' },
  { type: 'stopwatch',  label: 'Stopwatch',         description: 'Timer with lap tracking',                          icon: '⏱' },
  { type: 'todo',       label: 'To-Do List',        description: 'Tasks with checkboxes, synced to the cloud',       icon: '✓' },
];

export default function AddWidgetModal({ open, onClose, onAdd }: Props) {
  // Escape key closes the modal.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleAdd(type: WidgetType) {
    await onAdd(type);
    onClose();
  }

  return (
    // Clicking the overlay closes; stopPropagation prevents the modal itself from closing.
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Widget</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <div className="widget-options">
            {WIDGET_OPTIONS.map((opt) => (
              <button key={opt.type} className="widget-option-card" onClick={() => handleAdd(opt.type)}>
                <span className="widget-option-icon">{opt.icon}</span>
                <span className="widget-option-label">{opt.label}</span>
                <span className="widget-option-desc">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
