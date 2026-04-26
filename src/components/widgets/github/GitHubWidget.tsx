import { useState } from 'react';
import { useGitHub } from '@/hooks/useGitHub';
import { useAuth } from '@/contexts/AuthContext';
import { connectGitHubToken } from '@/services/firebase/auth';
import type { GitHubEvent } from '@/services/github/githubService';
import '@/styles/components/github.scss';

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function describeEvent(event: GitHubEvent): string {
  const p = event.payload;
  switch (event.type) {
    case 'PushEvent': {
      const n = (p.commits as unknown[])?.length ?? 0;
      return `Pushed ${n} commit${n !== 1 ? 's' : ''}`;
    }
    case 'PullRequestEvent': {
      const pr = p.pull_request as { number: number };
      return `${String(p.action)} PR #${pr?.number}`;
    }
    case 'IssuesEvent': {
      const issue = p.issue as { number: number };
      return `${String(p.action)} issue #${issue?.number}`;
    }
    case 'CreateEvent':
      return `Created ${String(p.ref_type)}${p.ref ? ` "${String(p.ref)}"` : ''}`;
    case 'DeleteEvent':
      return `Deleted ${String(p.ref_type)}`;
    case 'WatchEvent':
      return 'Starred repo';
    case 'ForkEvent':
      return 'Forked repo';
    case 'IssueCommentEvent':
      return 'Commented on issue';
    case 'PullRequestReviewEvent':
      return 'Reviewed PR';
    default:
      return event.type.replace('Event', '');
  }
}

function eventColor(type: string): string {
  switch (type) {
    case 'PushEvent':               return 'var(--accent-blue)';
    case 'PullRequestEvent':        return 'var(--accent-purple)';
    case 'IssuesEvent':
    case 'IssueCommentEvent':       return 'var(--accent-orange)';
    case 'CreateEvent':             return 'var(--accent-green)';
    default:                        return 'var(--text-muted)';
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EventItem({ event }: { event: GitHubEvent }) {
  const repoShort = event.repo.name.split('/')[1] ?? event.repo.name;
  return (
    <li className="gh-event">
      <span className="gh-event-dot" style={{ background: eventColor(event.type) }} />
      <div className="gh-event-body">
        <span className="gh-event-desc">{describeEvent(event)}</span>
        <span className="gh-event-meta">
          {repoShort} · {timeAgo(event.createdAt)}
        </span>
      </div>
    </li>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export default function GitHubWidget() {
  const { user } = useAuth();
  const { loading, error, connected, user: ghUser, events, refresh } = useGitHub();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  async function handleConnect() {
    if (!user) return;
    setConnecting(true);
    setConnectError('');
    try {
      await connectGitHubToken(user.uid);
      refresh();
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Connection failed.');
    } finally {
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="gh-state">
        <span className="gh-state-text">Loading GitHub data...</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="gh-state">
        <svg className="gh-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        <p className="gh-state-text">Connect GitHub to see your activity</p>
        {connectError && <p className="gh-error-text">{connectError}</p>}
        <button className="gh-connect-btn" onClick={handleConnect} disabled={connecting}>
          {connecting ? 'Connecting...' : 'Connect GitHub'}
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gh-state">
        <p className="gh-error-text">{error}</p>
        <button className="gh-connect-btn" onClick={handleConnect} disabled={connecting}>
          {connecting ? 'Reconnecting...' : 'Reconnect GitHub'}
        </button>
      </div>
    );
  }

  return (
    <div className="gh-widget">
      <div className="gh-profile">
        <img src={ghUser?.avatarUrl} alt={ghUser?.login} className="gh-avatar" />
        <div className="gh-profile-info">
          <span className="gh-username">@{ghUser?.login}</span>
          <span className="gh-stats">
            {ghUser?.publicRepos} repos · {ghUser?.followers} followers
          </span>
        </div>
        <button className="gh-refresh-btn" onClick={refresh} title="Refresh" aria-label="Refresh">
          ↻
        </button>
      </div>

      {events.length === 0 ? (
        <p className="gh-empty">No recent activity found.</p>
      ) : (
        <ul className="gh-events">
          {events.map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}
