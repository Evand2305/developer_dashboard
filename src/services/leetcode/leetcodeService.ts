// Pluggable LeetCode data layer. To swap the backend, implement LeetCodeProvider
// and reassign the `leetcodeService` export at the bottom of this file.

export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
  ranking: number;
}

export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: number;
  lang: string;
}

export interface LeetCodeProvider {
  getStats(username: string): Promise<LeetCodeStats>;
  getRecentSubmissions(username: string, limit: number): Promise<LeetCodeSubmission[]>;
}

// Stats come from leetcode-api-faisalshohag.vercel.app (Vercel-hosted, always on,
// flat JSON response). Submissions come from alfa-leetcode-api.onrender.com
// (Render free tier, may cold-start); failures return [] so stats still render.
class FaisalLeetCodeProvider implements LeetCodeProvider {
  private readonly statsBase = 'https://leetcode-api-faisalshohag.vercel.app';
  private readonly subBase   = 'https://alfa-leetcode-api.onrender.com';

  async getStats(username: string): Promise<LeetCodeStats> {
    const res = await fetch(`${this.statsBase}/${encodeURIComponent(username)}`);
    if (res.status === 404) throw new Error(`LeetCode user "${username}" not found.`);
    if (!res.ok)            throw new Error(`LeetCode API error ${res.status}. Try again shortly.`);

    const d = await res.json() as {
      totalSolved?: number; easySolved?: number; mediumSolved?: number;
      hardSolved?: number;  totalEasy?: number;  totalMedium?: number;
      totalHard?: number;   ranking?: number;
    };

    if (d.totalSolved === undefined)
      throw new Error(`User "${username}" not found or profile is private.`);

    return {
      username,
      totalSolved:  d.totalSolved  ?? 0,
      easySolved:   d.easySolved   ?? 0,
      mediumSolved: d.mediumSolved ?? 0,
      hardSolved:   d.hardSolved   ?? 0,
      totalEasy:    d.totalEasy    ?? 0,
      totalMedium:  d.totalMedium  ?? 0,
      totalHard:    d.totalHard    ?? 0,
      ranking:      d.ranking      ?? 0,
    };
  }

  // Silently returns [] on any failure so the widget degrades gracefully.
  async getRecentSubmissions(username: string, limit = 10): Promise<LeetCodeSubmission[]> {
    try {
      const res = await fetch(
        `${this.subBase}/recentAcSubmissions?username=${encodeURIComponent(username)}&limit=${limit}`,
      );
      if (!res.ok) return [];
      const data = await res.json() as {
        recentAcSubmissionList?: Array<{ title: string; titleSlug: string; timestamp: string; lang: string }>;
      };
      return (data.recentAcSubmissionList ?? []).map((s) => ({
        title: s.title, titleSlug: s.titleSlug, timestamp: Number(s.timestamp), lang: s.lang,
      }));
    } catch {
      return [];
    }
  }
}

export const leetcodeService: LeetCodeProvider = new FaisalLeetCodeProvider();
