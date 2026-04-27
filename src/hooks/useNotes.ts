// Real-time CRUD hook for the Notes widget. Notes are sorted by most recently
// updated. Updates use optimistic local state so the UI feels instant.
import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, doc,
  addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db }      from '@/services/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes]     = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Live listener — notes update instantly across tabs/devices.
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'users', user.uid, 'notes');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id:        d.id,
        title:     d.data().title as string,
        content:   d.data().content as string,
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
      }));
      setNotes(data.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  // Creates a blank note and returns its id so the editor can open it immediately.
  async function addNote(): Promise<string | null> {
    if (!user) return null;
    const ref = await addDoc(collection(db, 'users', user.uid, 'notes'), {
      title: 'Untitled', content: '',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  // Optimistic update: local state changes first so the editor feels instant,
  // then the write goes to Firestore.
  async function updateNote(id: string, data: Partial<Pick<Note, 'title' | 'content'>>) {
    if (!user) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...data, updatedAt: new Date() } : n)),
    );
    await updateDoc(doc(db, 'users', user.uid, 'notes', id), {
      ...data, updatedAt: serverTimestamp(),
    });
  }

  // Optimistic delete: removes from local state immediately.
  async function deleteNote(id: string) {
    if (!user) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
  }

  return { notes, loading, addNote, updateNote, deleteNote };
}
