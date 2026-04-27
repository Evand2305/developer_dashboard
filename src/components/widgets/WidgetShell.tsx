// Wrapper rendered around every widget. Provides the drag handle header
// (with minimize ▽ and remove ✕ buttons) and the scrollable content area.
// stopPropagation on widget-content prevents text selection from triggering a drag.
import type { ReactNode } from 'react';
import type { Widget }    from '@/types/widget';

// Human-readable title for each widget type shown in the header.
// Add an entry here whenever a new WidgetType is created.
export const WIDGET_TITLES: Record<string, string> = {
  github:     'GitHub Activity',
  leetcode:   'LeetCode',
  notes:      'Notes',
  calculator: 'Calculator',
  converter:  'Base Converter',
  colorcode:  'Color Identifier',
  quicklinks: 'Quick Links',
  stopwatch:  'Stopwatch',
  todo:       'To-Do List',
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
      {/* widget-drag-handle is the CSS class react-grid-layout uses to start a drag. */}
      <div className="widget-header widget-drag-handle">
        <span className="widget-title">{WIDGET_TITLES[widget.type]}</span>
        <div className="widget-actions">
          <button className="widget-action-btn"
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            aria-label="Minimize widget" title="Minimize">▽</button>
          <button className="widget-action-btn"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove widget" title="Remove widget">✕</button>
        </div>
      </div>
      {/* onMouseDown stops drag starting when the user selects text inside the widget. */}
      <div className="widget-content" onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
