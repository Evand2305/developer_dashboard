// Bookmark manager stored in widget.config.links. Links open in a new tab.
// Prepends https:// automatically if the user omits a protocol.
import { useState } from 'react';
import '@/styles/components/quicklinks.scss';

interface QuickLink { id: string; title: string; url: string }

interface Props {
  config: Record<string, unknown>;
  onSaveConfig: (config: Record<string, unknown>) => Promise<void>;
}

// Guarantees every stored URL is an absolute URL so target="_blank" works.
function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export default function QuickLinksWidget({ config, onSaveConfig }: Props) {
  const links         = (config.links as QuickLink[] | undefined) ?? [];
  const [title, setTitle] = useState('');
  const [url, setUrl]     = useState('');
  const [error, setError] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!url.trim())   { setError('URL is required.');   return; }
    setError('');
    const newLink: QuickLink = {
      id: Date.now().toString(), title: title.trim(), url: ensureProtocol(url.trim()),
    };
    await onSaveConfig({ ...config, links: [...links, newLink] });
    setTitle(''); setUrl('');
  }

  async function handleDelete(id: string) {
    await onSaveConfig({ ...config, links: links.filter((l) => l.id !== id) });
  }

  return (
    <div className="ql-widget">
      {links.length === 0 ? (
        <p className="ql-empty">No links yet — add one below.</p>
      ) : (
        <ul className="ql-list">
          {links.map((link) => (
            <li key={link.id} className="ql-item">
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="ql-link" title={link.url}>
                <span className="ql-dot" />{link.title}
              </a>
              <button className="ql-delete" onClick={() => handleDelete(link.id)}
                aria-label="Remove link" title="Remove">✕</button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="ql-form">
        <input className="ql-input" value={title}
          onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input className="ql-input" value={url} type="url"
          onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        {error && <p className="ql-error">{error}</p>}
        <button type="submit" className="ql-add-btn">+ Add Link</button>
      </form>
    </div>
  );
}
