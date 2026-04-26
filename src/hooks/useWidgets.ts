import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from '@/utils/debounce';
import type { Widget, WidgetPosition, WidgetType } from '@/types/widget';

const COLS = 48;

const DEFAULT_SIZE: Record<WidgetType, { w: number; h: number }> = {
  github: { w: 2, h: 3 },
  leetcode: { w: 2, h: 3 },
  notes: { w: 2, h: 3 },
};

function fitsAt(occupied: Set<string>, x: number, y: number, w: number, h: number): boolean {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (occupied.has(`${x + dx},${y + dy}`)) return false;
    }
  }
  return true;
}

function findOpenPosition(widgets: Widget[], w: number, h: number): { x: number; y: number } {
  const occupied = new Set<string>();
  for (const widget of widgets) {
    for (let row = widget.position.y; row < widget.position.y + widget.position.h; row++) {
      for (let col = widget.position.x; col < widget.position.x + widget.position.w; col++) {
        occupied.add(`${col},${row}`);
      }
    }
  }
  for (let row = 0; row < 1000; row++) {
    for (let col = 0; col <= COLS - w; col++) {
      if (fitsAt(occupied, col, row, w, h)) return { x: col, y: row };
    }
  }
  return { x: 0, y: 0 };
}

export function useWidgets() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

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
    const position = findOpenPosition(widgets, w, h);
    await addDoc(collection(db, 'users', user.uid, 'widgets'), {
      type,
      position: { ...position, w, h },
      config: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const savePosition = useRef(
    debounce(async (uid: string, id: string, position: WidgetPosition) => {
      await updateDoc(doc(db, 'users', uid, 'widgets', id), {
        position,
        updatedAt: serverTimestamp(),
      });
    }, 800),
  ).current;

  function updateWidgetPosition(id: string, position: WidgetPosition) {
    if (!user) return;
    savePosition(user.uid, id, position);
  }

  async function updateWidgetConfig(id: string, config: Record<string, unknown>) {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'widgets', id), {
      config,
      updatedAt: serverTimestamp(),
    });
  }

  async function removeWidget(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'widgets', id));
  }

  return { widgets, loading, addWidget, updateWidgetPosition, updateWidgetConfig, removeWidget };
}
