export type WidgetType = 'github' | 'leetcode' | 'notes';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
