// Reads the stored GitHub token from Firestore then fetches the user's profile
// and recent events from the GitHub API. tick drives manual refresh.
import { useState, useEffect } from 'react';
import { doc, getDoc }         from 'firebase/firestore';
import { db }                  from '@/services/firebase/config';
import { useAuth }             from '@/contexts/AuthContext';
import { getGitHubUser, getGitHubEvents } from '@/services/github/githubService';
import type { GitHubUser, GitHubEvent }   from '@/services/github/githubService';

interface GitHubState {
  loading: boolean;
  error: string | null;
  connected: boolean;
  user: GitHubUser | null;
  events: GitHubEvent[];
}

const INITIAL: GitHubState = {
  loading: true, error: null, connected: false, user: null, events: [],
};

export function useGitHub() {
  const { user } = useAuth();
  const [state, setState] = useState<GitHubState>(INITIAL);
  const [tick, setTick]   = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    void (async () => {
      try {
        // Check if the user has connected GitHub.
        const snap = await getDoc(doc(db, 'users', user.uid, 'integrations', 'github'));
        if (!snap.exists()) {
          if (!cancelled) setState({ ...INITIAL, loading: false });
          return;
        }

        const { accessToken } = snap.data() as { accessToken: string };
        const ghUser  = await getGitHubUser(accessToken);
        const events  = await getGitHubEvents(accessToken, ghUser.login);

        if (!cancelled)
          setState({ loading: false, error: null, connected: true, user: ghUser, events });
      } catch (err) {
        if (!cancelled)
          setState((s) => ({
            ...s, loading: false,
            error: err instanceof Error ? err.message : 'Failed to load GitHub data.',
          }));
      }
    })();

    // Prevent stale state updates if the component unmounts mid-fetch.
    return () => { cancelled = true; };
  }, [user, tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}
