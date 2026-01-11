export type LayoutMode = 'DEFAULT' | 'CONTENT_SHARED' | 'SCREEN_SHARE';

export interface LayoutConfig {
  mode: LayoutMode;
  hostColumnSpan: number;
  transcriptColumnSpan: number;
  guestColumnSpan: number;
  contentColumnSpan: number;
  showPiP: boolean;
  pipSize: { width: number; height: number };
  pipPosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export const LAYOUTS: Record<LayoutMode, LayoutConfig> = {
  DEFAULT: {
    mode: 'DEFAULT',
    hostColumnSpan: 4,
    transcriptColumnSpan: 4,
    guestColumnSpan: 4,
    contentColumnSpan: 0,
    showPiP: false,
    pipSize: { width: 0, height: 0 },
    pipPosition: 'bottom-right'
  },
  CONTENT_SHARED: {
    mode: 'CONTENT_SHARED',
    hostColumnSpan: 0,
    transcriptColumnSpan: 0,
    guestColumnSpan: 0,
    contentColumnSpan: 9,
    showPiP: true,
    pipSize: { width: 150, height: 150 },
    pipPosition: 'bottom-left'
  },
  SCREEN_SHARE: {
    mode: 'SCREEN_SHARE',
    hostColumnSpan: 0,
    transcriptColumnSpan: 0,
    guestColumnSpan: 0,
    contentColumnSpan: 12,
    showPiP: true,
    pipSize: { width: 120, height: 120 },
    pipPosition: 'bottom-right'
  }
};

export interface LayoutChangeEvent {
  timestamp: number;
  relativeOffset: number;
  fromLayout: LayoutMode;
  toLayout: LayoutMode;
  reason: string;
}

export class LayoutManager {
  private currentLayout: LayoutMode = 'DEFAULT';
  private layoutHistory: LayoutChangeEvent[] = [];
  private onLayoutChange?: (layout: LayoutConfig, event: LayoutChangeEvent) => void;

  constructor(onLayoutChange?: (layout: LayoutConfig, event: LayoutChangeEvent) => void) {
    this.onLayoutChange = onLayoutChange;
  }

  getCurrentLayout(): LayoutConfig {
    return LAYOUTS[this.currentLayout];
  }

  switchLayout(
    newLayout: LayoutMode,
    relativeOffset: number,
    reason: string = 'manual'
  ): LayoutChangeEvent {
    const event: LayoutChangeEvent = {
      timestamp: Date.now(),
      relativeOffset,
      fromLayout: this.currentLayout,
      toLayout: newLayout,
      reason
    };

    this.currentLayout = newLayout;
    this.layoutHistory.push(event);

    if (this.onLayoutChange) {
      this.onLayoutChange(LAYOUTS[newLayout], event);
    }

    console.log(`[LayoutManager] Switched from ${event.fromLayout} to ${event.toLayout} (${reason})`);

    return event;
  }

  autoSwitchForContent(
    contentType: 'image' | 'document' | 'video' | 'audio' | 'screen',
    relativeOffset: number
  ): LayoutChangeEvent {
    const newLayout = contentType === 'screen' ? 'SCREEN_SHARE' : 'CONTENT_SHARED';
    return this.switchLayout(newLayout, relativeOffset, `content_shared_${contentType}`);
  }

  returnToDefault(relativeOffset: number): LayoutChangeEvent {
    return this.switchLayout('DEFAULT', relativeOffset, 'content_closed');
  }

  getLayoutHistory(): LayoutChangeEvent[] {
    return [...this.layoutHistory];
  }

  reset(): void {
    this.currentLayout = 'DEFAULT';
    this.layoutHistory = [];
  }

  // Export layout events for metadata storage
  exportEvents(): LayoutChangeEvent[] {
    return this.layoutHistory.map(event => ({
      timestamp: event.timestamp,
      relativeOffset: event.relativeOffset,
      fromLayout: event.fromLayout,
      toLayout: event.toLayout,
      reason: event.reason
    }));
  }

  // Import layout events from session metadata (for replay)
  importEvents(events: LayoutChangeEvent[]): void {
    this.layoutHistory = events;
  }

  // Apply layout event at specific time (for replay)
  applyEventAtTime(currentTimeMs: number): LayoutConfig | null {
    // Find the most recent layout change before current time
    let activeLayout: LayoutMode = 'DEFAULT';

    for (const event of this.layoutHistory) {
      if (event.relativeOffset <= currentTimeMs) {
        activeLayout = event.toLayout;
      } else {
        break; // Events are in chronological order
      }
    }

    if (activeLayout !== this.currentLayout) {
      this.currentLayout = activeLayout;
      return LAYOUTS[activeLayout];
    }

    return null;
  }
}

// Helper: Calculate PiP styles for CSS
export function getPiPStyles(config: LayoutConfig, index: number = 0): React.CSSProperties {
  const positions: Record<typeof config.pipPosition, React.CSSProperties> = {
    'bottom-left': {
      bottom: `${24 + (index * (config.pipSize.height + 12))}px`,
      left: '24px'
    },
    'bottom-right': {
      bottom: `${24 + (index * (config.pipSize.height + 12))}px`,
      right: '24px'
    },
    'top-left': {
      top: `${24 + (index * (config.pipSize.height + 12))}px`,
      left: '24px'
    },
    'top-right': {
      top: `${24 + (index * (config.pipSize.height + 12))}px`,
      right: '24px'
    }
  };

  return {
    position: 'absolute',
    width: `${config.pipSize.width}px`,
    height: `${config.pipSize.height}px`,
    ...positions[config.pipPosition],
    zIndex: 30,
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid rgba(168, 85, 247, 0.4)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
  };
}
