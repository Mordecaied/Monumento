import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs';

export interface BackgroundRemovalConfig {
  outputStride: 8 | 16 | 32;
  segmentationThreshold: number;
  blurAmount: number;
  edgeBlur: number;
}

const DEFAULT_CONFIG: BackgroundRemovalConfig = {
  outputStride: 16, // Balance between accuracy and performance (8=slow/accurate, 32=fast/less accurate)
  segmentationThreshold: 0.6, // Confidence threshold for person segmentation
  blurAmount: 3, // Fallback blur amount if background removal fails
  edgeBlur: 3 // Edge smoothing to reduce artifacts
};

export class BackgroundRemovalService {
  private model: bodyPix.BodyPix | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backgroundImage: HTMLImageElement | null = null;
  private config: BackgroundRemovalConfig;
  private isProcessing = false;
  private lastFrameTime = 0;
  private targetFPS = 30;
  private frameInterval: number;

  constructor(config: Partial<BackgroundRemovalConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', {
      willReadFrequently: true,
      alpha: false
    })!;
    this.frameInterval = 1000 / this.targetFPS;
  }

  async initialize(): Promise<void> {
    try {
      console.log('[BackgroundRemoval] Loading BodyPix model...');
      this.model = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: this.config.outputStride,
        multiplier: 0.75, // Model size (0.5, 0.75, 1.0) - 0.75 balances quality and performance
        quantBytes: 2 // Use 2-byte weights for better performance
      });
      console.log('[BackgroundRemoval] Model loaded successfully');
    } catch (error) {
      console.error('[BackgroundRemoval] Failed to load model:', error);
      throw error;
    }
  }

  setBackgroundImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.backgroundImage = img;
        console.log('[BackgroundRemoval] Background image loaded:', imageUrl);
        resolve();
      };
      img.onerror = (err) => {
        console.error('[BackgroundRemoval] Failed to load background image:', err);
        reject(err);
      };
      img.src = imageUrl;
    });
  }

  async processFrame(
    videoElement: HTMLVideoElement,
    outputCanvas: HTMLCanvasElement
  ): Promise<boolean> {
    // FPS throttling
    const now = performance.now();
    if (now - this.lastFrameTime < this.frameInterval) {
      return false; // Skip frame to maintain target FPS
    }
    this.lastFrameTime = now;

    if (!this.model || this.isProcessing) {
      return false;
    }

    if (videoElement.readyState < 2) {
      return false; // Video not ready
    }

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      // Set canvas size to match video
      if (this.canvas.width !== videoElement.videoWidth) {
        this.canvas.width = videoElement.videoWidth;
        this.canvas.height = videoElement.videoHeight;
        outputCanvas.width = videoElement.videoWidth;
        outputCanvas.height = videoElement.videoHeight;
      }

      // Perform person segmentation
      const segmentation = await this.model.segmentPerson(videoElement, {
        flipHorizontal: false,
        internalResolution: 'medium', // low/medium/high - medium gives good balance
        segmentationThreshold: this.config.segmentationThreshold
      });

      // Draw background
      const outputCtx = outputCanvas.getContext('2d')!;
      if (this.backgroundImage) {
        // Draw virtual studio background
        outputCtx.drawImage(
          this.backgroundImage,
          0,
          0,
          outputCanvas.width,
          outputCanvas.height
        );
      } else {
        // Fallback: solid color background
        outputCtx.fillStyle = '#1a1a1a';
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
      }

      // Draw video frame to temporary canvas
      this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      // Create masked image (only person pixels)
      const maskedImageData = outputCtx.createImageData(imageData.width, imageData.height);
      const pixels = imageData.data;
      const maskedPixels = maskedImageData.data;
      const mask = segmentation.data;

      // Apply segmentation mask with edge smoothing
      for (let i = 0; i < mask.length; i++) {
        const offset = i * 4;
        if (mask[i] === 1) {
          // Person pixel - copy from original
          maskedPixels[offset] = pixels[offset];         // R
          maskedPixels[offset + 1] = pixels[offset + 1]; // G
          maskedPixels[offset + 2] = pixels[offset + 2]; // B
          maskedPixels[offset + 3] = 255;                // A (fully opaque)
        } else {
          // Background pixel - transparent
          maskedPixels[offset + 3] = 0;
        }
      }

      // Apply edge blur to reduce artifacts
      if (this.config.edgeBlur > 0) {
        this.applyEdgeBlur(maskedImageData, mask, this.config.edgeBlur);
      }

      // Draw person on top of background
      outputCtx.putImageData(maskedImageData, 0, 0);

      const processingTime = performance.now() - startTime;
      if (processingTime > 50) {
        console.warn(`[BackgroundRemoval] Frame processing took ${processingTime.toFixed(1)}ms (target: <50ms)`);
      }

      this.isProcessing = false;
      return true;
    } catch (error) {
      console.error('[BackgroundRemoval] Frame processing error:', error);
      this.isProcessing = false;
      return false;
    }
  }

  private applyEdgeBlur(imageData: ImageData, mask: Uint8Array, blurRadius: number): void {
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;

    // Find edge pixels (where mask changes from 0 to 1)
    for (let y = blurRadius; y < height - blurRadius; y++) {
      for (let x = blurRadius; x < width - blurRadius; x++) {
        const idx = y * width + x;

        // Check if this is an edge pixel
        if (mask[idx] === 1) {
          let hasBackground = false;
          // Check neighbors
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborIdx = (y + dy) * width + (x + dx);
              if (mask[neighborIdx] === 0) {
                hasBackground = true;
                break;
              }
            }
            if (hasBackground) break;
          }

          // If edge pixel, apply slight transparency
          if (hasBackground) {
            const offset = idx * 4;
            pixels[offset + 3] = Math.floor(pixels[offset + 3] * 0.9); // 90% opacity at edges
          }
        }
      }
    }
  }

  async processStreamToCanvas(
    videoElement: HTMLVideoElement,
    outputCanvas: HTMLCanvasElement,
    onFrame?: (fps: number) => void
  ): Promise<() => void> {
    let animationFrameId: number;
    let frameCount = 0;
    let fpsStartTime = performance.now();

    const processLoop = async () => {
      await this.processFrame(videoElement, outputCanvas);

      // Calculate FPS
      frameCount++;
      const elapsed = performance.now() - fpsStartTime;
      if (elapsed >= 1000) {
        const fps = (frameCount / elapsed) * 1000;
        if (onFrame) onFrame(fps);
        frameCount = 0;
        fpsStartTime = performance.now();
      }

      animationFrameId = requestAnimationFrame(processLoop);
    };

    processLoop();

    // Return cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }

  createStreamFromCanvas(canvas: HTMLCanvasElement): MediaStream {
    return canvas.captureStream(this.targetFPS);
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.backgroundImage = null;
    console.log('[BackgroundRemoval] Service disposed');
  }
}

// Helper: Apply blur fallback if background removal fails or performs poorly
export function applyBlurFallback(
  videoElement: HTMLVideoElement,
  outputCanvas: HTMLCanvasElement,
  blurAmount: number = 10
): void {
  const ctx = outputCanvas.getContext('2d')!;
  outputCanvas.width = videoElement.videoWidth;
  outputCanvas.height = videoElement.videoHeight;

  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(videoElement, 0, 0, outputCanvas.width, outputCanvas.height);
  ctx.filter = 'none';
}
