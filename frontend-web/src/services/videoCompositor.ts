/**
 * VideoCompositor Service
 *
 * Creates properly mixed video recordings by compositing host avatar and guest webcam
 * feeds in real-time on a canvas, then capturing the canvas output as a MediaStream.
 *
 * Features:
 * - Canvas rendering at 1280x720 (16:9 aspect ratio) @ 30fps
 * - Smooth fade transitions (200ms) between speakers
 * - Host view: Static avatar image with optional animated overlay
 * - Guest view: Raw webcam feed (background removal enhancement comes later)
 * - Captures composed output via canvas.captureStream()
 */

export type CompositorSpeaker = 'host' | 'guest';

export interface VideoCompositorConfig {
  width: number;
  height: number;
  fps: number;
  fadeDurationMs: number;
}

const DEFAULT_CONFIG: VideoCompositorConfig = {
  width: 1280,
  height: 720,
  fps: 30,
  fadeDurationMs: 200,
};

export class VideoCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: VideoCompositorConfig;

  // Media elements
  private guestVideo: HTMLVideoElement;
  private hostImage: HTMLImageElement;
  private hostAnimatedVideo?: HTMLVideoElement;

  // State
  private activeSpeaker: CompositorSpeaker = 'guest';
  private fadeProgress: number = 1; // 0-1, 1 means fully transitioned
  private fadeStartTime: number = 0;
  private isRendering: boolean = false;
  private animationFrameId: number | null = null;
  private outputStream: MediaStream | null = null;

  // Flags
  private isHostTalking: boolean = false;
  private showHostAnimation: boolean = false;

  constructor(
    guestStream: MediaStream,
    hostAvatarUrl: string,
    hostAnimatedVideoUrl?: string,
    config: Partial<VideoCompositorConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('VideoCompositor: Failed to get 2D canvas context');
    }
    this.ctx = context;

    // Set up guest video element
    this.guestVideo = document.createElement('video');
    this.guestVideo.srcObject = guestStream;
    this.guestVideo.autoplay = true;
    this.guestVideo.muted = true;
    this.guestVideo.playsInline = true;

    // Set up host avatar image
    this.hostImage = new Image();
    this.hostImage.crossOrigin = 'anonymous';
    this.hostImage.src = hostAvatarUrl;

    // Set up host animated video (optional)
    if (hostAnimatedVideoUrl) {
      this.showHostAnimation = true;
      this.hostAnimatedVideo = document.createElement('video');
      this.hostAnimatedVideo.src = hostAnimatedVideoUrl;
      this.hostAnimatedVideo.autoplay = true;
      this.hostAnimatedVideo.loop = true;
      this.hostAnimatedVideo.muted = true;
      this.hostAnimatedVideo.playsInline = true;
    }

    console.log('[VideoCompositor] Initialized:', {
      resolution: `${this.config.width}x${this.config.height}`,
      fps: this.config.fps,
      hasAnimation: !!hostAnimatedVideoUrl
    });
  }

  /**
   * Start the compositor and return the composed MediaStream
   */
  start(): MediaStream {
    if (this.isRendering) {
      console.warn('[VideoCompositor] Already rendering');
      return this.outputStream!;
    }

    // Capture the canvas as a MediaStream
    this.outputStream = this.canvas.captureStream(this.config.fps);

    // Start render loop
    this.isRendering = true;
    this.renderFrame();

    console.log('[VideoCompositor] Started rendering');

    return this.outputStream;
  }

  /**
   * Set the active speaker and trigger fade transition
   */
  setActiveSpeaker(speaker: CompositorSpeaker): void {
    if (this.activeSpeaker !== speaker) {
      console.log(`[VideoCompositor] Switching to ${speaker}`);
      this.activeSpeaker = speaker;
      this.fadeProgress = 0;
      this.fadeStartTime = Date.now();
    }
  }

  /**
   * Update host talking state for animated overlay
   */
  setHostTalking(isTalking: boolean): void {
    this.isHostTalking = isTalking;
  }

  /**
   * Main render loop - called at 30fps via requestAnimationFrame
   */
  private renderFrame = (): void => {
    if (!this.isRendering) return;

    // Update fade progress
    if (this.fadeProgress < 1) {
      const elapsed = Date.now() - this.fadeStartTime;
      this.fadeProgress = Math.min(1, elapsed / this.config.fadeDurationMs);
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render based on active speaker with fade transition
    if (this.activeSpeaker === 'guest') {
      // Render guest view
      this.renderGuestView();

      // If fading, overlay the previous speaker (host)
      if (this.fadeProgress < 1) {
        this.ctx.globalAlpha = 1 - this.fadeProgress;
        this.renderHostView();
        this.ctx.globalAlpha = 1;
      }
    } else {
      // Render host view
      this.renderHostView();

      // If fading, overlay the previous speaker (guest)
      if (this.fadeProgress < 1) {
        this.ctx.globalAlpha = 1 - this.fadeProgress;
        this.renderGuestView();
        this.ctx.globalAlpha = 1;
      }
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.renderFrame);
  };

  /**
   * Render guest webcam view
   * Note: For now, rendering raw webcam without background removal
   * VirtualStudio background removal integration comes in a later enhancement
   */
  private renderGuestView(): void {
    try {
      // Draw the guest video to fill the canvas
      // Use object-fit: cover logic to maintain aspect ratio
      const videoAspect = this.guestVideo.videoWidth / this.guestVideo.videoHeight;
      const canvasAspect = this.canvas.width / this.canvas.height;

      let sx = 0, sy = 0, sw = this.guestVideo.videoWidth, sh = this.guestVideo.videoHeight;

      if (videoAspect > canvasAspect) {
        // Video is wider - crop sides
        const targetWidth = this.guestVideo.videoHeight * canvasAspect;
        sx = (this.guestVideo.videoWidth - targetWidth) / 2;
        sw = targetWidth;
      } else {
        // Video is taller - crop top/bottom
        const targetHeight = this.guestVideo.videoWidth / canvasAspect;
        sy = (this.guestVideo.videoHeight - targetHeight) / 2;
        sh = targetHeight;
      }

      this.ctx.drawImage(
        this.guestVideo,
        sx, sy, sw, sh,
        0, 0, this.canvas.width, this.canvas.height
      );
    } catch (err) {
      // Video might not be ready yet, fill with black
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Render host avatar view with optional animated overlay
   */
  private renderHostView(): void {
    try {
      // Draw static avatar image
      if (this.hostImage.complete && this.hostImage.naturalHeight !== 0) {
        this.ctx.drawImage(
          this.hostImage,
          0, 0,
          this.canvas.width,
          this.canvas.height
        );
      } else {
        // Image not loaded yet, fill with dark gray
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      // If host is talking and animated video is available, overlay it semi-transparently
      if (this.isHostTalking && this.showHostAnimation && this.hostAnimatedVideo) {
        this.ctx.globalAlpha = 0.3; // Semi-transparent overlay
        this.ctx.drawImage(
          this.hostAnimatedVideo,
          0, 0,
          this.canvas.width,
          this.canvas.height
        );
        this.ctx.globalAlpha = 1.0;
      }
    } catch (err) {
      // Image might not be loaded yet, fill with dark gray
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Stop the compositor and clean up resources
   */
  dispose(): void {
    console.log('[VideoCompositor] Disposing');

    this.isRendering = false;

    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop output stream tracks
    if (this.outputStream) {
      this.outputStream.getTracks().forEach(track => track.stop());
      this.outputStream = null;
    }

    // Clean up video elements
    this.guestVideo.srcObject = null;

    if (this.hostAnimatedVideo) {
      this.hostAnimatedVideo.pause();
      this.hostAnimatedVideo.src = '';
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Get the canvas element (useful for debugging or preview)
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get current active speaker
   */
  getActiveSpeaker(): CompositorSpeaker {
    return this.activeSpeaker;
  }

  /**
   * Check if compositor is currently rendering
   */
  isActive(): boolean {
    return this.isRendering;
  }
}
