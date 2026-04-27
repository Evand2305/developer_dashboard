// Thin wrapper around the GitHub REST API. All calls require an OAuth access
// token and surface typed errors for 401 (expired) and 403 (rate limit).
const BASE = 'https://api.github.com';

export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
}

// A single entry from /users/{login}/events — payload varies by event type.
export interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  createdAt: string;
  payload: Record<string, unknown>;
}

// Shared fetch helper: attaches auth header and maps HTTP errors to messages.
async function ghFetch<T>(endpoint: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 401) throw new Error('GitHub token expired. Please reconnect.');
  if (res.status === 403) {
    if (res.headers.get('X-RateLimit-Remaining') === '0') {
      const reset   = res.headers.get('X-RateLimit-Reset');
      const resetAt = reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : 'soon';
      throw new Error(`GitHub rate limit reached. Resets at ${resetAt}.`);
    }
    throw new Error('GitHub access denied.');
  }
  if (!res.ok) throw new Error(`GitHub error ${res.status}.`);
  return res.json() as Promise<T>;
}

// Fetches the authenticated user's profile (name, avatar, repo count, followers).
export async function getGitHubUser(token: string): Promise<GitHubUser> {
  const d = await ghFetch<{
    login: string; name: string | null; avatar_url: string;
    public_repos: number; followers: number; following: number;
  }>('/user', token);
  return {
    login: d.login, name: d.name, avatarUrl: d.avatar_url,
    publicRepos: d.public_repos, followers: d.followers, following: d.following,
  };
}

// Fetches up to 30 recent events for the given username (pushes, PRs, issues, etc.).
export async function getGitHubEvents(token: string, login: string): Promise<GitHubEvent[]> {
  const data = await ghFetch<
    Array<{ id: string; type: string; repo: { name: string }; created_at: string; payload: Record<string, unknown> }>
  >(`/users/${login}/events?per_page=30`, token);
  return data.map((e) => ({
    id: e.id, type: e.type,
    repo: { name: e.repo.name }, createdAt: e.created_at, payload: e.payload,
  }));
}
