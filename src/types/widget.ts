// Core type definitions shared across the widget system.

// All supported widget types — add new entries here when creating a new widget.
export type WidgetType =
  | 'github'
  | 'leetcode'
  | 'notes'
  | 'calculator'
  | 'converter'
  | 'colorcode'
  | 'quicklinks'
  | 'stopwatch'
  | 'todo';

// Grid position and dimensions in react-grid-layout column/row units.
export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Full widget record as stored in Firestore.
// config holds widget-specific settings (e.g. leetcodeUsername, links array).
export interface Widget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
