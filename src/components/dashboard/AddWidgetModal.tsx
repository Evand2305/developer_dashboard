import { useEffect } from 'react';
import type { WidgetType } from '@/types/widget';
import '@/styles/components/modal.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType) => Promise<void>;
}

const WIDGET_OPTIONS: {
  type: WidgetType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    type: 'github',
    label: 'GitHub Activity',
    description: 'Recent commits, pull requests, and repo activity',
    icon: 'GH',
  },
  {
    type: 'leetcode',
    label: 'LeetCode',
    description: 'Problems solved and recent submission activity',
    icon: 'LC',
  },
  {
    type: 'notes',
    label: 'Notes',
    description: 'Quick notes synced to the cloud',
    icon: '##',
  },
];

export default function AddWidgetModal({ open, onClose, onAdd }: Props) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleAdd(type: WidgetType) {
    await onAdd(type);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Widget</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="widget-options">
            {WIDGET_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                className="widget-option-card"
                onClick={() => handleAdd(opt.type)}
              >
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
