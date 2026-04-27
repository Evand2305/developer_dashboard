import { useState, useEffect, useRef, useMemo } from 'react';
import RGL from 'react-grid-layout';
import type { Layout, LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetShell, { WIDGET_TITLES } from '@/components/widgets/WidgetShell';
import GitHubWidget from '@/components/widgets/github/GitHubWidget';
import LeetCodeWidget from '@/components/widgets/leetcode/LeetCodeWidget';
import NotesWidget from '@/components/widgets/notes/NotesWidget';
import type { Widget, WidgetPosition } from '@/types/widget';
import '@/styles/components/widget.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactGridLayout = RGL as any;

const COL_WIDTH = 84;
const ROW_HEIGHT = 80;
const GRID_MARGIN = 16;
const SCROLL_ZONE = 80;
const SCROLL_SPEED = 12;

function toLayoutItem(w: Widget): LayoutItem {
  return {
    i: w.id,
    x: w.position.x,
    y: w.position.y,
    w: w.position.w,
    h: w.position.h,
    minW: 1,
    minH: 2,
  };
}

function renderContent(widget: Widget, onUpdateConfig: Props['onUpdateConfig']) {
  switch (widget.type) {
    case 'github': return <GitHubWidget />;
    case 'leetcode':
      return (
        <LeetCodeWidget
          config={widget.config}
          onSaveConfig={(cfg) => onUpdateConfig(widget.id, cfg)}
        />
      );
    case 'notes': return <NotesWidget />;
  }
}

// ── Minimized bar ─────────────────────────────────────────────────────────────

function MinimizedBar({
  widgets,
  onRestore,
}: {
  widgets: Widget[];
  onRestore: (widget: Widget) => void;
}) {
  if (widgets.length === 0) return null;
  return (
    <div className="minimized-bar">
      {widgets.map((w) => (
        <button
          key={w.id}
          className="minimized-chip"
          onClick={() => onRestore(w)}
          title="Restore widget"
        >
          <span>{WIDGET_TITLES[w.type]}</span>
          <span className="minimized-chip-icon">▲</span>
        </button>
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  widgets: Widget[];
  loading: boolean;
  onUpdatePosition: (id: string, position: WidgetPosition) => void;
  onUpdateConfig: (id: string, config: Record<string, unknown>) => Promise<void>;
  onBatchUpdatePositions: (updates: { id: string; position: WidgetPosition }[]) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

// ── WidgetGrid ────────────────────────────────────────────────────────────────

export default function WidgetGrid({
  widgets,
  loading,
  onUpdatePosition,
  onUpdateConfig,
  onBatchUpdatePositions,
  onRemove,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(() => window.innerWidth);
  const [localLayout, setLocalLayout] = useState<LayoutItem[]>([]);
  const prevIdsRef = useRef(new Set<string>());
  // Maps widget id → the full layout item it should be restored to.
  // handleLayoutChange uses this to stop react-grid-layout from clamping or
  // repositioning widgets that were just added back to the grid.
  const restoredItemRef = useRef(new Map<string, LayoutItem>());

  const scrollVelocity = useRef({ dx: 0, dy: 0 });
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeWidgets = useMemo(
    () => widgets.filter((w) => w.config.minimized !== true),
    [widgets],
  );
  const minimizedWidgets = useMemo(
    () => widgets.filter((w) => w.config.minimized === true),
    [widgets],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, activeWidgets.length]);

  const { effectiveCols, gridWidth } = useMemo(() => {
    const rightmost = activeWidgets.reduce(
      (m, w) => Math.max(m, w.position.x + w.position.w),
      0,
    );
    const viewportCols = Math.max(
      Math.floor((containerWidth - GRID_MARGIN) / (COL_WIDTH + GRID_MARGIN)),
      6,
    );
    const cols = Math.max(rightmost + 3, viewportCols);
    return {
      effectiveCols: cols,
      gridWidth: COL_WIDTH * cols + GRID_MARGIN * (cols + 1),
    };
  }, [activeWidgets, containerWidth]);

  // Sync localLayout when active widget IDs change (add, remove, minimize, restore)
  useEffect(() => {
    const currentIds = new Set(activeWidgets.map((w) => w.id));
    const added = activeWidgets.filter((w) => !prevIdsRef.current.has(w.id));
    const removedIds = [...prevIdsRef.current].filter((id) => !currentIds.has(id));
    prevIdsRef.current = currentIds;
    if (added.length === 0 && removedIds.length === 0) return;
    setLocalLayout((prev) => [
      ...prev.filter((l) => !removedIds.includes(l.i)),
      ...added.map(toLayoutItem),
    ]);
  }, [activeWidgets]);

  const effectiveLayout = useMemo((): LayoutItem[] => {
    const localIds = new Set(localLayout.map((l) => l.i));
    return [
      ...localLayout,
      ...activeWidgets.filter((w) => !localIds.has(w.id)).map(toLayoutItem),
    ];
  }, [localLayout, activeWidgets]);

  // ── Minimize / Restore ──────────────────────────────────────────────────────

  function handleMinimize(widget: Widget) {
    // Update prevIdsRef immediately so the Firestore sync effect
    // doesn't try to remove it a second time when the config update lands.
    prevIdsRef.current = new Set([...prevIdsRef.current].filter((id) => id !== widget.id));

    // Always save the current h so restore can use it even if position.h
    // was corrupted by a previous minimize implementation.
    const h = widget.position.h;
    const thresholdY = widget.position.y + h;

    const shifted = activeWidgets
      .filter((w) => w.id !== widget.id && w.position.y >= thresholdY)
      .map((w) => ({ id: w.id, position: { ...w.position, y: w.position.y - h } }));

    setLocalLayout((prev) =>
      prev
        .filter((l) => l.i !== widget.id)
        .map((l) => {
          const s = shifted.find((sh) => sh.id === l.i);
          return s ? { ...l, y: s.position.y } : l;
        }),
    );

    void onUpdateConfig(widget.id, { ...widget.config, minimized: true, savedH: h });
    if (shifted.length > 0) void onBatchUpdatePositions(shifted);
  }

  function handleRestore(widget: Widget) {
    // Update prevIdsRef immediately so the Firestore sync effect
    // doesn't add the widget to localLayout a second time.
    prevIdsRef.current = new Set([...prevIdsRef.current, widget.id]);

    // Use savedH from config — widget.position.h may be stale (e.g. h=1
    // from a previous minimize implementation that wrote h=1 to Firestore).
    // If neither value is usable, fall back to the default widget height (3).
    const savedH = widget.config.savedH as number | undefined;
    const h = savedH ?? (widget.position.h > 2 ? widget.position.h : 3);
    const restoreY = widget.position.y;
    const restoredItem: LayoutItem = { ...toLayoutItem(widget), h };
    restoredItemRef.current.set(widget.id, restoredItem);

    const shifted = activeWidgets
      .filter((w) => w.position.y >= restoreY)
      .map((w) => ({ id: w.id, position: { ...w.position, y: w.position.y + h } }));

    setLocalLayout((prev) => {
      const updated = prev.map((l) => {
        const s = shifted.find((sh) => sh.id === l.i);
        return s ? { ...l, y: s.position.y } : l;
      });
      return [...updated, { ...toLayoutItem(widget), h }];
    });

    void onUpdateConfig(widget.id, { ...widget.config, minimized: false });
    if (shifted.length > 0) void onBatchUpdatePositions(shifted);
  }

  // ── Auto-scroll ─────────────────────────────────────────────────────────────

  function stopAutoScroll() {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    scrollVelocity.current = { dx: 0, dy: 0 };
  }

  function handleDrag(
    _layout: Layout,
    _old: LayoutItem | null,
    _new: LayoutItem | null,
    _placeholder: LayoutItem | null,
    e: Event,
  ) {
    const { clientX, clientY } = e as MouseEvent;
    const { innerWidth, innerHeight } = window;
    let dx = 0;
    let dy = 0;
    if (clientX > innerWidth - SCROLL_ZONE)  dx =  SCROLL_SPEED;
    else if (clientX < SCROLL_ZONE)          dx = -SCROLL_SPEED;
    if (clientY > innerHeight - SCROLL_ZONE) dy =  SCROLL_SPEED;
    else if (clientY < SCROLL_ZONE)          dy = -SCROLL_SPEED;

    scrollVelocity.current = { dx, dy };

    if ((dx !== 0 || dy !== 0) && !scrollInterval.current) {
      scrollInterval.current = setInterval(() => {
        const { dx: vx, dy: vy } = scrollVelocity.current;
        if (vx !== 0 || vy !== 0) window.scrollBy(vx, vy);
      }, 16);
    } else if (dx === 0 && dy === 0) {
      stopAutoScroll();
    }
  }

  function handleLayoutChange(newLayout: Layout) {
    const corrected = [...newLayout].map((item) => {
      const expected = restoredItemRef.current.get(item.i);
      if (expected !== undefined) {
        if (item.h === expected.h && item.w === expected.w) {
          // react-grid-layout has stabilised at the correct values
          restoredItemRef.current.delete(item.i);
          return item;
        }
        // react-grid-layout changed x/y/w/h — enforce the correct values
        return { ...item, x: expected.x, y: expected.y, w: expected.w, h: expected.h };
      }
      return item;
    });
    setLocalLayout(corrected);
    corrected.forEach((item) => {
      const widget = activeWidgets.find((w) => w.id === item.i);
      if (!widget) return;
      const p = widget.position;
      if (p.x !== item.x || p.y !== item.y || p.w !== item.w || p.h !== item.h) {
        onUpdatePosition(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
      }
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <MinimizedBar widgets={minimizedWidgets} onRestore={handleRestore} />

      {loading ? (
        <div className="grid-loading">Loading widgets...</div>
      ) : activeWidgets.length === 0 && minimizedWidgets.length === 0 ? (
        <div className="grid-empty">
          <p>No widgets yet — click <strong>+ Add Widget</strong> to get started.</p>
        </div>
      ) : activeWidgets.length > 0 ? (
        <ReactGridLayout
          className="widget-grid"
          layout={effectiveLayout}
          cols={effectiveCols}
          rowHeight={ROW_HEIGHT}
          width={gridWidth}
          compactType={null}
          preventCollision={false}
          onLayoutChange={handleLayoutChange}
          onDrag={handleDrag}
          onDragStop={stopAutoScroll}
          draggableHandle=".widget-drag-handle"
          draggableCancel=".widget-content"
          margin={[GRID_MARGIN, GRID_MARGIN]}
        >
          {activeWidgets.map((widget) => (
            <div key={widget.id}>
              <WidgetShell
                widget={widget}
                onRemove={() => onRemove(widget.id)}
                onMinimize={() => handleMinimize(widget)}
              >
                {renderContent(widget, onUpdateConfig)}
              </WidgetShell>
            </div>
          ))}
        </ReactGridLayout>
      ) : null}
    </div>
  );
}
