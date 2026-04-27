// Stopwatch with lap tracking. Time is tracked via Date.now() deltas stored in
// refs rather than accumulated state, so pausing and resuming works accurately.
import { useState, useRef, useEffect } from 'react';
import '@/styles/components/stopwatch.scss';

// Formats milliseconds as MM:SS.cs (centiseconds).
function fmt(ms: number): string {
  const min  = Math.floor(ms / 60000);
  const sec  = Math.floor((ms % 60000) / 1000);
  const cent = Math.floor((ms % 1000) / 10);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
}

export default function StopwatchWidget() {
  const [time, setTime]       = useState(0);      // display value in ms
  const [running, setRunning] = useState(false);
  const [laps, setLaps]       = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef    = useRef(0);    // timestamp when the current run started
  const elapsedRef  = useRef(0);   // total ms accumulated before the last pause

  // Clean up interval on unmount to prevent memory leaks.
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function start() {
    startRef.current = Date.now();
    setRunning(true);
    // Update display every 10 ms for smooth centisecond counting.
    intervalRef.current = setInterval(() => {
      setTime(elapsedRef.current + (Date.now() - startRef.current));
    }, 10);
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    elapsedRef.current += Date.now() - startRef.current;
    setRunning(false);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTime(0); setRunning(false); setLaps([]);
    elapsedRef.current = 0;
  }

  function lap() { setLaps((prev) => [...prev, time]); }

  // Derive split (time since last lap) and total for each lap entry.
  const lapTimes = laps.map((t, i) => ({ num: i + 1, total: t, split: t - (laps[i - 1] ?? 0) }));

  return (
    <div className="sw-widget">
      <div className="sw-display">{fmt(time)}</div>

      <div className="sw-controls">
        {/* Left button is context-sensitive: Lap while running, Reset when stopped. */}
        <button className="sw-btn sw-btn--secondary"
          onClick={running ? lap : reset} disabled={!running && time === 0}>
          {running ? 'Lap' : 'Reset'}
        </button>
        <button className={`sw-btn ${running ? 'sw-btn--stop' : 'sw-btn--start'}`}
          onClick={running ? stop : start}>
          {running ? 'Stop' : 'Start'}
        </button>
      </div>

      {lapTimes.length > 0 && (
        <div className="sw-laps">
          <div className="sw-laps-header">
            <span>Lap</span><span>Split</span><span>Total</span>
          </div>
          <ul className="sw-laps-list">
            {/* Most recent lap first. */}
            {[...lapTimes].reverse().map((l) => (
              <li key={l.num} className="sw-lap">
                <span className="sw-lap-num">#{l.num}</span>
                <span className="sw-lap-split">{fmt(l.split)}</span>
                <span className="sw-lap-total">{fmt(l.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
