// Fetches LeetCode stats and recent submissions for a given username via the
// pluggable leetcodeService. Re-fetches whenever username or tick changes.
import { useState, useEffect } from 'react';
import { leetcodeService }     from '@/services/leetcode/leetcodeService';
import type { LeetCodeStats, LeetCodeSubmission } from '@/services/leetcode/leetcodeService';

interface LeetCodeState {
  loading: boolean;
  error: string | null;
  stats: LeetCodeStats | null;
  submissions: LeetCodeSubmission[];
}

export function useLeetCode(username: string | null) {
  const [state, setState] = useState<LeetCodeState>({
    loading: false, error: null, stats: null, submissions: [],
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setState({ loading: true, error: null, stats: null, submissions: [] });

    void (async () => {
      try {
        // Fetch stats and recent submissions concurrently.
        const [stats, submissions] = await Promise.all([
          leetcodeService.getStats(username),
          leetcodeService.getRecentSubmissions(username, 10),
        ]);
        if (!cancelled) setState({ loading: false, error: null, stats, submissions });
      } catch (err) {
        if (!cancelled)
          setState({
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load LeetCode data.',
            stats: null, submissions: [],
          });
      }
    })();

    return () => { cancelled = true; };
  }, [username, tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}
