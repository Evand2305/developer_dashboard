import type { ReactNode } from 'react';
import type { Widget } from '@/types/widget';

export const WIDGET_TITLES: Record<string, string> = {
  github: 'GitHub Activity',
  leetcode: 'LeetCode',
  notes: 'Notes',
};

interface Props {
  widget: Widget;
  onRemove: () => void;
  onMinimize: () => void;
  children: ReactNode;
}

export default function WidgetShell({ widget, onRemove, onMinimize, children }: Props) {
  return (
    <div className="widget-shell">
      <div className="widget-header widget-drag-handle">
        <span className="widget-title">{WIDGET_TITLES[widget.type]}</span>
        <div className="widget-actions">
          <button
            className="widget-action-btn"
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            aria-label="Minimize widget"
            title="Minimize"
          >
            ▽
          </button>
          <button
            className="widget-action-btn"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
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
