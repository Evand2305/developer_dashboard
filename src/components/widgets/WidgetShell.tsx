import type { ReactNode } from 'react';
import type { Widget } from '@/types/widget';

const WIDGET_TITLES: Record<string, string> = {
  github: 'GitHub Activity',
  leetcode: 'LeetCode',
  notes: 'Notes',
};

interface Props {
  widget: Widget;
  onRemove: () => void;
  children: ReactNode;
}

export default function WidgetShell({ widget, onRemove, children }: Props) {
  return (
    <div className="widget-shell">
      <div className="widget-header widget-drag-handle">
        <span className="widget-title">{WIDGET_TITLES[widget.type]}</span>
        <div className="widget-actions">
          <button
            className="widget-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove widget"
            title="Remove widget"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="widget-content" onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
