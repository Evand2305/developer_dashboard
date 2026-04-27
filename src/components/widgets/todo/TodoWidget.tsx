// Cloud-synced to-do list. Tasks are stored in widget.config.todos so they
// persist across sessions without a separate Firestore collection.
// Incomplete tasks are shown first; completed tasks appear below with strikethrough.
import { useState } from 'react';
import '@/styles/components/todo.scss';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;   // Unix ms — used for sort ordering
}

interface Props {
  config: Record<string, unknown>;
  onSaveConfig: (config: Record<string, unknown>) => Promise<void>;
}

export default function TodoWidget({ config, onSaveConfig }: Props) {
  const todos      = (config.todos as TodoItem[] | undefined) ?? [];
  const [input, setInput] = useState('');

  // Incomplete first (newest first), then complete (newest first).
  const incomplete = todos.filter((t) => !t.completed).sort((a, b) => b.createdAt - a.createdAt);
  const complete   = todos.filter((t) =>  t.completed).sort((a, b) => b.createdAt - a.createdAt);
  const sorted     = [...incomplete, ...complete];

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const item: TodoItem = {
      id: Date.now().toString(), text: input.trim(),
      completed: false, createdAt: Date.now(),
    };
    await onSaveConfig({ ...config, todos: [...todos, item] });
    setInput('');
  }

  async function toggle(id: string) {
    await onSaveConfig({
      ...config,
      todos: todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    });
  }

  async function remove(id: string) {
    await onSaveConfig({ ...config, todos: todos.filter((t) => t.id !== id) });
  }

  // Removes all completed tasks in one config write.
  async function clearCompleted() {
    await onSaveConfig({ ...config, todos: todos.filter((t) => !t.completed) });
  }

  const doneCount = complete.length;

  return (
    <div className="todo-widget">
      <form onSubmit={addTodo} className="todo-form">
        <input className="todo-input" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder="Add a task..." />
        <button type="submit" className="todo-add-btn" disabled={!input.trim()}>+</button>
      </form>

      {todos.length > 0 && (
        <div className="todo-meta">
          <span>{doneCount} of {todos.length} done</span>
          {doneCount > 0 && (
            <button className="todo-clear" onClick={clearCompleted}>Clear done</button>
          )}
        </div>
      )}

      {todos.length === 0 ? (
        <p className="todo-empty">No tasks yet — add one above.</p>
      ) : (
        <ul className="todo-list">
          {sorted.map((item) => (
            <li key={item.id} className={`todo-item ${item.completed ? 'todo-item--done' : ''}`}>
              <button className={`todo-check ${item.completed ? 'todo-check--checked' : ''}`}
                onClick={() => toggle(item.id)}
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}>
                {item.completed && '✓'}
              </button>
              <span className="todo-text">{item.text}</span>
              <button className="todo-delete" onClick={() => remove(item.id)} aria-label="Delete task">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
