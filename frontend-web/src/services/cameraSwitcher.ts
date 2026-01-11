export type Speaker = 'guest' | 'host';

export interface SpeakerEvent {
  speaker: Speaker;
  timestamp: number;
  relativeOffset: number;
  confidence: number;
  volumeLevel: number;
}

export interface CameraSwitchConfig {
  volumeThreshold: number;
  hysteresisMs: number;
  confidenceThreshold: number;
  silenceTimeoutMs: number;
}

const DEFAULT_CONFIG: CameraSwitchConfig = {
  volumeThreshold: 15, // Minimum volume to consider someone talking
  hysteresisMs: 500, // Duration of sustained speech before switching
  confidenceThreshold: 0.7, // Minimum confidence to trigger switch
  silenceTimeoutMs: 2000 // Time before considering both silent
};

export class CameraSwitcher {
  private config: CameraSwitchConfig;
  private activeSpeaker: Speaker | null = null;
  private pendingSpeaker: Speaker | null = null;
  private pendingStartTime: number = 0;
  private lastSwitchTime: number = 0;
  private switchHistory: SpeakerEvent[] = [];
  private lastGuestVolume: number = 0;
  private lastHostVolume: number = 0;
  private lastActivityTime: number = Date.now();

  constructor(config: Partial<CameraSwitchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process volume levels and determine if camera should switch
   * Returns the active speaker and whether a switch occurred
   */
  processVolumes(
    guestVolume: number,
    hostVolume: number,
    relativeOffset: number
  ): {
    activeSpeaker: Speaker | null;
    switched: boolean;
    event?: SpeakerEvent
  } {
    this.lastGuestVolume = guestVolume;
    this.lastHostVolume = hostVolume;

    const now = Date.now();
    const guestTalking = guestVolume > this.config.volumeThreshold;
    const hostTalking = hostVolume > this.config.volumeThreshold;

    // Calculate confidence based on volume difference
    let newSpeaker: Speaker | null = null;
    let confidence = 0;

    if (guestTalking && !hostTalking) {
      newSpeaker = 'guest';
      confidence = Math.min(guestVolume / 100, 1.0);
    } else if (hostTalking && !guestTalking) {
      newSpeaker = 'host';
      confidence = Math.min(hostVolume / 100, 1.0);
    } else if (guestTalking && hostTalking) {
      // Both talking - choose louder speaker
      if (guestVolume > hostVolume * 1.2) {
        newSpeaker = 'guest';
        confidence = Math.min((guestVolume - hostVolume) / 100, 0.9);
      } else if (hostVolume > guestVolume * 1.2) {
        newSpeaker = 'host';
        confidence = Math.min((hostVolume - guestVolume) / 100, 0.9);
      } else {
        // Too close - maintain current speaker
        newSpeaker = this.activeSpeaker;
        confidence = 0.5;
      }
    }

    // Update activity time
    if (guestTalking || hostTalking) {
      this.lastActivityTime = now;
    }

    // Check for silence timeout
    if (now - this.lastActivityTime > this.config.silenceTimeoutMs) {
      this.activeSpeaker = null;
      this.pendingSpeaker = null;
      return { activeSpeaker: null, switched: false };
    }

    // Hysteresis logic: require sustained speech before switching
    if (newSpeaker && newSpeaker !== this.activeSpeaker) {
      if (newSpeaker === this.pendingSpeaker) {
        // Same pending speaker - check if sustained long enough
        const duration = now - this.pendingStartTime;
        if (duration >= this.config.hysteresisMs && confidence >= this.config.confidenceThreshold) {
          // Switch confirmed!
          const event: SpeakerEvent = {
            speaker: newSpeaker,
            timestamp: now,
            relativeOffset,
            confidence,
            volumeLevel: newSpeaker === 'guest' ? guestVolume : hostVolume
          };

          this.activeSpeaker = newSpeaker;
          this.pendingSpeaker = null;
          this.lastSwitchTime = now;
          this.switchHistory.push(event);

          console.log(`[CameraSwitcher] Switched to ${newSpeaker} (confidence: ${confidence.toFixed(2)})`);

          return { activeSpeaker: newSpeaker, switched: true, event };
        }
      } else {
        // New pending speaker
        this.pendingSpeaker = newSpeaker;
        this.pendingStartTime = now;
      }
    } else if (newSpeaker === this.activeSpeaker) {
      // Maintained current speaker - reset pending
      this.pendingSpeaker = null;
    }

    return { activeSpeaker: this.activeSpeaker, switched: false };
  }

  getActiveSpeaker(): Speaker | null {
    return this.activeSpeaker;
  }

  getSwitchHistory(): SpeakerEvent[] {
    return [...this.switchHistory];
  }

  getCurrentVolumes(): { guest: number; host: number } {
    return {
      guest: this.lastGuestVolume,
      host: this.lastHostVolume
    };
  }

  // Export switch events for metadata storage
  exportEvents(): SpeakerEvent[] {
    return this.switchHistory.map(event => ({
      speaker: event.speaker,
      timestamp: event.timestamp,
      relativeOffset: event.relativeOffset,
      confidence: event.confidence,
      volumeLevel: event.volumeLevel
    }));
  }

  // Import switch events from session metadata (for replay)
  importEvents(events: SpeakerEvent[]): void {
    this.switchHistory = events;
  }

  // Apply camera switch at specific time (for replay)
  applySwitchAtTime(currentTimeMs: number): Speaker | null {
    let activeSpeaker: Speaker | null = null;

    for (const event of this.switchHistory) {
      if (event.relativeOffset <= currentTimeMs) {
        activeSpeaker = event.speaker;
      } else {
        break; // Events are in chronological order
      }
    }

    return activeSpeaker;
  }

  reset(): void {
    this.activeSpeaker = null;
    this.pendingSpeaker = null;
    this.pendingStartTime = 0;
    this.lastSwitchTime = 0;
    this.switchHistory = [];
    this.lastActivityTime = Date.now();
  }
}

// Helper: Get volume level from AnalyserNode
export function getVolumeLevel(analyser: AnalyserNode): number {
  const dataArray = new Uint8Array(analyser.fftSize);
  analyser.getByteFrequencyData(dataArray);

  const sum = dataArray.reduce((acc, val) => acc + val, 0);
  const average = sum / dataArray.length;

  return Math.floor(average);
}
