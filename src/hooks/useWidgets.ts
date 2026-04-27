// Manages all widget state: real-time Firestore sync, CRUD operations,
// drag/resize persistence, minimize/restore logic, and grid placement.
import { useEffect, useRef, useState } from 'react';
import {
  collection, onSnapshot, doc,
  addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db }          from '@/services/firebase/config';
import { useAuth }     from '@/contexts/AuthContext';
import { debounce }    from '@/utils/debounce';
import type { Widget, WidgetPosition, WidgetType } from '@/types/widget';

// Maximum columns the grid can use (react-grid-layout constraint).
const COLS = 48;

// Row width used when placing new widgets. Fixed at 12 so 6 default-size
// (w=2) widgets fill a row consistently across all screen sizes.
const PLACEMENT_COLS = 12;

// Default grid dimensions for each widget type when first added.
const DEFAULT_SIZE: Record<WidgetType, { w: number; h: number }> = {
  github:     { w: 2, h: 3 },
  leetcode:   { w: 2, h: 3 },
  notes:      { w: 2, h: 3 },
  calculator: { w: 2, h: 3 },
  converter:  { w: 2, h: 3 },
  colorcode:  { w: 2, h: 3 },
  quicklinks: { w: 2, h: 3 },
  stopwatch:  { w: 2, h: 3 },
  todo:       { w: 2, h: 3 },
};

// Returns true if the w×h rectangle starting at (x, y) has no occupied cells.
function fitsAt(occupied: Set<string>, x: number, y: number, w: number, h: number): boolean {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      if (occupied.has(`${x + dx},${y + dy}`)) return false;
  return true;
}

// Scans the grid left-to-right, top-to-bottom and returns the first position
// where a w×h widget fits without overlapping existing widgets.
function findOpenPosition(
  widgets: Widget[],
  w: number,
  h: number,
  maxCols = COLS,
): { x: number; y: number } {
  const occupied = new Set<string>();
  for (const widget of widgets)
    for (let row = widget.position.y; row < widget.position.y + widget.position.h; row++)
      for (let col = widget.position.x; col < widget.position.x + widget.position.w; col++)
        occupied.add(`${col},${row}`);

  for (let row = 0; row < 1000; row++)
    for (let col = 0; col <= maxCols - w; col++)
      if (fitsAt(occupied, col, row, w, h)) return { x: col, y: row };

  return { x: 0, y: 0 };
}

export function useWidgets() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener: keeps widgets in sync with Firestore automatically.
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'users', user.uid, 'widgets');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
      }));
      setWidgets(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  async function addWidget(type: WidgetType) {
    if (!user) return;
    const { w, h } = DEFAULT_SIZE[type];
    // Exclude minimized widgets: their cells are invisible so should not
    // block placement of new widgets.
    const active   = widgets.filter((wg) => wg.config.minimized !== true);
    const position = findOpenPosition(active, w, h, PLACEMENT_COLS);
    await addDoc(collection(db, 'users', user.uid, 'widgets'), {
      type, position: { ...position, w, h }, config: {},
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }

  // Debounced so rapid drag events produce only one Firestore write per widget.
  const savePosition = useRef(
    debounce(async (uid: string, id: string, position: WidgetPosition) => {
      await updateDoc(doc(db, 'users', uid, 'widgets', id), {
        position, updatedAt: serverTimestamp(),
      });
    }, 800),
  ).current;

  function updateWidgetPosition(id: string, position: WidgetPosition) {
    if (!user) return;
    savePosition(user.uid, id, position);
  }

  // Used when minimize/restore shifts multiple widgets at once; avoids the
  // 800 ms debounce delay by writing all positions in a single Promise.all.
  async function batchUpdatePositions(updates: { id: string; position: WidgetPosition }[]) {
    if (!user) return;
    await Promise.all(
      updates.map(({ id, position }) =>
        updateDoc(doc(db, 'users', user.uid, 'widgets', id), {
          position, updatedAt: serverTimestamp(),
        }),
      ),
    );
  }

  // Replaces the entire config object for a widget (e.g. saving leetcodeUsername).
  async function updateWidgetConfig(id: string, config: Record<string, unknown>) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'widgets', id), {
      config, updatedAt: serverTimestamp(),
    });
  }

  async function removeWidget(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'widgets', id));
  }

  // Resets all widgets to their default sizes and recalculates positions from
  // scratch in creation order. Strips minimize state but preserves user data
  // (e.g. leetcodeUsername) so widgets remain configured after reset.
  async function resetWidgets() {
    if (!user) return;
    const sorted = [...widgets].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const placed: { position: { x: number; y: number; w: number; h: number } }[] = [];

    await Promise.all(
      sorted.map((widget) => {
        const { w, h } = DEFAULT_SIZE[widget.type];
        const position  = findOpenPosition(placed as unknown as Widget[], w, h);
        const newPos    = { x: position.x, y: position.y, w, h };
        placed.push({ position: newPos });

        const newConfig: Record<string, unknown> = Object.fromEntries(
          Object.entries(widget.config).filter(
            ([key]) => !['minimized', 'savedH', 'savedPosition'].includes(key),
          ),
        );
        return updateDoc(doc(db, 'users', user.uid, 'widgets', widget.id), {
          position: newPos, config: newConfig, updatedAt: serverTimestamp(),
        });
      }),
    );
  }

  return {
    widgets, loading,
    addWidget, updateWidgetPosition, batchUpdatePositions,
    updateWidgetConfig, resetWidgets, removeWidget,
  };
}
