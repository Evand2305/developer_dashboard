import { useState, useEffect, useRef } from 'react';
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/hooks/useNotes';
import '@/styles/components/notes.scss';

function formatDate(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

// ── Note List ────────────────────────────────────────────────────────────────

interface ListProps {
  notes: Note[];
  onSelect: (id: string) => void;
  onNew: () => void;
}

function NoteList({ notes, onSelect, onNew }: ListProps) {
  return (
    <div className="notes-list-view">
      <div className="notes-toolbar">
        <span className="notes-count">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        <button className="notes-new-btn" onClick={onNew}>+ New</button>
      </div>

      {notes.length === 0 ? (
        <div className="notes-empty">
          <span>No notes yet.</span>
          <span>Click &ldquo;+ New&rdquo; to get started.</span>
        </div>
      ) : (
        <ul className="notes-items">
          {notes.map((note) => (
            <li key={note.id} className="notes-item" onClick={() => onSelect(note.id)}>
              <span className="notes-item-title">
                {note.title.trim() || 'Untitled'}
              </span>
              <span className="notes-item-date">{formatDate(note.updatedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Note Editor ──────────────────────────────────────────────────────────────

interface EditorProps {
  note: Note;
  onBack: () => void;
  onDelete: () => void;
  onUpdate: (id: string, data: Partial<Pick<Note, 'title' | 'content'>>) => Promise<void>;
}

function NoteEditor({ note, onBack, onDelete, onUpdate }: EditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const onUpdateRef = useRef(onUpdate);

  // Always point to the latest onUpdate without re-triggering effects
  useEffect(() => { onUpdateRef.current = onUpdate; });

  // Reset fields when switching notes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save title 600ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      void onUpdateRef.current(note.id, { title });
    }, 600);
    return () => clearTimeout(timer);
  }, [title, note.id]);

  // Auto-save content 600ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      void onUpdateRef.current(note.id, { content });
    }, 600);
    return () => clearTimeout(timer);
  }, [content, note.id]);

  return (
    <div className="note-editor">
      <div className="note-editor-toolbar">
        <button className="note-back-btn" onClick={onBack}>← Back</button>
        <div className="note-editor-actions">
          <span className="note-saved-at">Saved {formatDate(note.updatedAt)}</span>
          <button className="note-delete-btn" onClick={onDelete} title="Delete note">
            Delete
          </button>
        </div>
      </div>

      <input
        className="note-title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        spellCheck
      />

      <textarea
        className="note-content-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        spellCheck
      />
    </div>
  );
}

// ── NotesWidget ──────────────────────────────────────────────────────────────

export default function NotesWidget() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  async function handleNewNote() {
    const id = await addNote();
    if (id) setSelectedId(id);
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    setSelectedId(null);
  }

  if (loading) {
    return <div className="notes-loading">Loading...</div>;
  }

  if (selectedNote) {
    return (
      <NoteEditor
        note={selectedNote}
        onBack={() => setSelectedId(null)}
        onDelete={() => handleDelete(selectedNote.id)}
        onUpdate={updateNote}
      />
    );
  }

  return (
    <NoteList
      notes={notes}
      onSelect={setSelectedId}
      onNew={handleNewNote}
    />
  );
}
