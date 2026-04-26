import { useState } from 'react';
import { useLeetCode } from '@/hooks/useLeetCode';
import type { LeetCodeStats, LeetCodeSubmission } from '@/services/leetcode/leetcodeService';
import '@/styles/components/leetcode.scss';

interface Props {
  config: Record<string, unknown>;
  onSaveConfig: (config: Record<string, unknown>) => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function submissionDate(ts: number): string {
  const diff = Date.now() - ts * 1000;
  if (diff < 86_400_000) return 'today';
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UsernameForm({
  initial,
  onSave,
}: {
  initial?: string;
  onSave: (username: string) => void;
}) {
  const [value, setValue] = useState(initial ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSave(value.trim());
  }

  return (
    <div className="lc-setup">
      <span className="lc-setup-icon">LC</span>
      <p className="lc-setup-text">
        {initial ? 'Update your LeetCode username' : 'Enter your LeetCode username'}
      </p>
      <form onSubmit={handleSubmit} className="lc-setup-form">
        <input
          className="lc-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="username"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="lc-btn" disabled={!value.trim()}>
          Save
        </button>
      </form>
    </div>
  );
}

function DiffBar({
  label,
  solved,
  total,
  color,
}: {
  label: string;
  solved: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((solved / total) * 100, 100) : 0;
  return (
    <div className="lc-diff-row">
      <span className="lc-diff-label" style={{ color }}>
        {label}
      </span>
      <div className="lc-diff-bar">
        <div className="lc-diff-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="lc-diff-count">
        {solved}
        <span className="lc-diff-total">/{total}</span>
      </span>
    </div>
  );
}

function StatsView({
  stats,
  submissions,
  onEdit,
  onRefresh,
}: {
  stats: LeetCodeStats;
  submissions: LeetCodeSubmission[];
  onEdit: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="lc-widget">
      <div className="lc-header">
        <div className="lc-user-info">
          <span className="lc-username">{stats.username}</span>
          {stats.ranking > 0 && (
            <span className="lc-ranking">Rank #{stats.ranking.toLocaleString()}</span>
          )}
        </div>
        <div className="lc-header-actions">
          <button className="lc-icon-btn" onClick={onRefresh} title="Refresh" aria-label="Refresh">↻</button>
          <button className="lc-icon-btn" onClick={onEdit} title="Edit username" aria-label="Edit username">✎</button>
        </div>
      </div>

      <div className="lc-total">
        <span className="lc-total-num">{stats.totalSolved}</span>
        <span className="lc-total-label">solved</span>
      </div>

      <div className="lc-diff-bars">
        <DiffBar label="Easy"   solved={stats.easySolved}   total={stats.totalEasy}   color="var(--accent-green)"  />
        <DiffBar label="Med"    solved={stats.mediumSolved} total={stats.totalMedium} color="var(--accent-orange)" />
        <DiffBar label="Hard"   solved={stats.hardSolved}   total={stats.totalHard}   color="var(--accent-red)"    />
      </div>

      {submissions.length > 0 && (
        <div className="lc-submissions">
          <p className="lc-section-label">Recent</p>
          <ul className="lc-sub-list">
            {submissions.map((s) => (
              <li key={`${s.titleSlug}-${s.timestamp}`} className="lc-sub-item">
                <span className="lc-sub-title">{s.title}</span>
                <span className="lc-sub-meta">{s.lang} · {submissionDate(s.timestamp)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export default function LeetCodeWidget({ config, onSaveConfig }: Props) {
  const [editing, setEditing] = useState(false);
  const username = config.leetcodeUsername as string | undefined;
  const { stats, submissions, loading, error, refresh } = useLeetCode(username ?? null);

  async function handleSaveUsername(uname: string) {
    await onSaveConfig({ ...config, leetcodeUsername: uname });
    setEditing(false);
  }

  if (!username || editing) {
    return (
      <UsernameForm
        initial={username}
        onSave={(uname) => void handleSaveUsername(uname)}
      />
    );
  }

  if (loading) {
    return (
      <div className="lc-state">
        <p className="lc-state-text">Loading {username}&apos;s stats...</p>
        <p className="lc-state-hint">First load may take up to 60 s if the API server is waking up.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lc-state">
        <p className="lc-error-text">{error}</p>
        <div className="lc-state-actions">
          <button className="lc-btn" onClick={refresh}>Retry</button>
          <button className="lc-btn-ghost" onClick={() => setEditing(true)}>Change username</button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <StatsView
      stats={stats}
      submissions={submissions}
      onEdit={() => setEditing(true)}
      onRefresh={refresh}
    />
  );
}
