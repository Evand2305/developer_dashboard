import { useState, useEffect, useRef, useMemo } from 'react';
import RGL from 'react-grid-layout';
import type { Layout, LayoutItem } from 'react-grid-layout';

// The bundled .d.mts types don't match the actual GridLayout API so we cast.
// The component works correctly at runtime — this is a type declaration issue only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactGridLayout = RGL as any;
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetShell from '@/components/widgets/WidgetShell';
import GitHubWidget from '@/components/widgets/github/GitHubWidget';
import LeetCodeWidget from '@/components/widgets/leetcode/LeetCodeWidget';
import NotesWidget from '@/components/widgets/notes/NotesWidget';
import type { Widget, WidgetPosition } from '@/types/widget';
import '@/styles/components/widget.scss';

const COL_WIDTH = 84;
const ROW_HEIGHT = 80;
const GRID_MARGIN = 16;
const SCROLL_ZONE = 80;
const SCROLL_SPEED = 12;

// LayoutItem = individual item { i, x, y, w, h }
// Layout     = readonly LayoutItem[]  (what react-grid-layout passes to callbacks)

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

interface Props {
  widgets: Widget[];
  loading: boolean;
  onUpdatePosition: (id: string, position: WidgetPosition) => void;
  onUpdateConfig: (id: string, config: Record<string, unknown>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

function renderContent(widget: Widget, onUpdateConfig: Props['onUpdateConfig']) {
  switch (widget.type) {
    case 'github':
      return <GitHubWidget />;
    case 'leetcode':
      return (
        <LeetCodeWidget
          config={widget.config}
          onSaveConfig={(cfg) => onUpdateConfig(widget.id, cfg)}
        />
      );
    case 'notes':
      return <NotesWidget />;
  }
}

export default function WidgetGrid({ widgets, loading, onUpdatePosition, onUpdateConfig, onRemove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(() => window.innerWidth);
  const [localLayout, setLocalLayout] = useState<LayoutItem[]>([]);
  const prevIdsRef = useRef(new Set<string>());

  const scrollVelocity = useRef({ dx: 0, dy: 0 });
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, widgets.length]);

  const { effectiveCols, gridWidth } = useMemo(() => {
    const rightmost = widgets.reduce((m, w) => Math.max(m, w.position.x + w.position.w), 0);
    const viewportCols = Math.max(
      Math.floor((containerWidth - GRID_MARGIN) / (COL_WIDTH + GRID_MARGIN)),
      6,
    );
    const cols = Math.max(rightmost + 3, viewportCols);
    return {
      effectiveCols: cols,
      gridWidth: COL_WIDTH * cols + GRID_MARGIN * (cols + 1),
    };
  }, [widgets, containerWidth]);

  useEffect(() => {
    const currentIds = new Set(widgets.map((w) => w.id));
    const added = widgets.filter((w) => !prevIdsRef.current.has(w.id));
    const removedIds = [...prevIdsRef.current].filter((id) => !currentIds.has(id));
    prevIdsRef.current = currentIds;
    if (added.length === 0 && removedIds.length === 0) return;
    setLocalLayout((prev) => [
      ...prev.filter((l) => !removedIds.includes(l.i)),
      ...added.map(toLayoutItem),
    ]);
  }, [widgets]);

  const effectiveLayout = useMemo((): LayoutItem[] => {
    const localIds = new Set(localLayout.map((l) => l.i));
    return [
      ...localLayout,
      ...widgets.filter((w) => !localIds.has(w.id)).map(toLayoutItem),
    ];
  }, [localLayout, widgets]);

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
    const mutable = [...newLayout];
    setLocalLayout(mutable);
    mutable.forEach((item) => {
      const widget = widgets.find((w) => w.id === item.i);
      if (!widget) return;
      const p = widget.position;
      if (p.x !== item.x || p.y !== item.y || p.w !== item.w || p.h !== item.h) {
        onUpdatePosition(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
      }
    });
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {loading ? (
        <div className="grid-loading">Loading widgets...</div>
      ) : widgets.length === 0 ? (
        <div className="grid-empty">
          <p>No widgets yet — click <strong>+ Add Widget</strong> to get started.</p>
        </div>
      ) : (
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
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetShell widget={widget} onRemove={() => onRemove(widget.id)}>
                {renderContent(widget, onUpdateConfig)}
              </WidgetShell>
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  );
}
