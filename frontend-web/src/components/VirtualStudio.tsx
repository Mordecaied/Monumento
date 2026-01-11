
import React, { useEffect, useRef, useState } from 'react';
import { StudioVibe } from '../types/index';
import { DEFAULT_BACKGROUNDS } from '../config/constants';
import { BackgroundRemovalService } from '../services/backgroundRemoval';
import { loadVirtualStudioBackground } from '../services/virtualStudios';

interface VirtualStudioProps {
  vibe: StudioVibe;
  customBackground: string | null;
  active: boolean;
  stream: MediaStream | null;
  onFrame?: (base64: string) => void;
}

const VirtualStudio: React.FC<VirtualStudioProps> = ({ vibe, customBackground, active, stream, onFrame }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundServiceRef = useRef<BackgroundRemovalService | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [useBackgroundRemoval, setUseBackgroundRemoval] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize background removal service
  useEffect(() => {
    if (!useBackgroundRemoval) return;

    const initService = async () => {
      try {
        setIsModelLoading(true);
        console.log('[VirtualStudio] Initializing background removal...');

        const service = new BackgroundRemovalService({
          outputStride: 16,
          segmentationThreshold: 0.6,
          edgeBlur: 3
        });

        await service.initialize();

        // Load virtual studio background
        const backgroundUrl = customBackground || await loadVirtualStudioBackground(vibe);
        await service.setBackgroundImage(backgroundUrl);

        backgroundServiceRef.current = service;
        console.log('[VirtualStudio] Background removal ready');
        setIsModelLoading(false);
      } catch (error) {
        console.error('[VirtualStudio] Failed to initialize background removal:', error);
        setUseBackgroundRemoval(false); // Fallback to blur
        setIsModelLoading(false);
      }
    };

    initService();

    return () => {
      if (backgroundServiceRef.current) {
        backgroundServiceRef.current.dispose();
        backgroundServiceRef.current = null;
      }
    };
  }, [vibe, customBackground, useBackgroundRemoval]);

  // Setup video stream
  useEffect(() => {
    if (active && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    } else if (!active && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [active, stream]);

  // Process video frames with background removal
  useEffect(() => {
    if (!active || !stream || !videoRef.current || !compositeCanvasRef.current) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    const processFrames = async () => {
      const video = videoRef.current!;
      const canvas = compositeCanvasRef.current!;

      if (useBackgroundRemoval && backgroundServiceRef.current) {
        // Use TensorFlow.js background removal
        const cleanup = await backgroundServiceRef.current.processStreamToCanvas(
          video,
          canvas,
          (currentFps) => setFps(currentFps)
        );
        cleanupRef.current = cleanup;
      } else {
        // Fallback: simple blur effect
        const ctx = canvas.getContext('2d')!;
        const processLoop = () => {
          if (video.readyState >= 2) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.filter = 'blur(10px)';
            ctx.drawImage(video, 0, 0);
            ctx.filter = 'none';
          }
          requestAnimationFrame(processLoop);
        };
        processLoop();
      }
    };

    processFrames();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [active, stream, useBackgroundRemoval]);

  // Send frames to Gemini for vision analysis
  useEffect(() => {
    if (!onFrame || !active || !stream) return;
    const interval = setInterval(() => {
      if (canvasRef.current && compositeCanvasRef.current && compositeCanvasRef.current.width > 0) {
        // Use composite canvas (with background removed) for Gemini frames
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = 400;
          canvasRef.current.height = 225;
          ctx.drawImage(compositeCanvasRef.current, 0, 0, 400, 225);
          const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
          onFrame(base64);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [onFrame, active, stream]);

  const bgUrl = customBackground || DEFAULT_BACKGROUNDS[vibe];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
      {/* Hidden video element for source */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />

      {/* Composite canvas with background removal applied */}
      <div className="absolute inset-0 flex items-center justify-center">
        {active && stream ? (
          <>
            {isModelLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <span className="text-xs font-black uppercase tracking-widest text-purple-400">Loading Background AI...</span>
                </div>
              </div>
            )}
            <canvas
              ref={compositeCanvasRef}
              className="h-full w-full object-cover scale-x-[-1]"
              style={{
                maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
              }}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/20">
            <div className="w-20 h-20 rounded-full border-2 border-current flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            </div>
            <span className="uppercase tracking-[0.3em] text-xs font-bold">Camera Standby</span>
          </div>
        )}
      </div>

      {/* Hidden canvas for Gemini frame export */}
      <canvas ref={canvasRef} width="400" height="225" className="hidden" />

      {/* Live indicator with FPS counter */}
      {active && (
        <div className="absolute top-6 left-6 px-4 py-2 rounded-full glass-panel flex items-center gap-3 z-20 border border-white/10 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[9px] font-black tracking-widest uppercase">Live Broadcast</span>
          {useBackgroundRemoval && fps > 0 && (
            <span className="text-[8px] font-bold text-emerald-400">{fps.toFixed(0)} FPS</span>
          )}
        </div>
      )}

      {/* Background removal toggle (dev tool) */}
      {active && (
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={() => setUseBackgroundRemoval(!useBackgroundRemoval)}
            className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-[8px] font-black uppercase tracking-wider text-white/60 hover:text-white/90 hover:border-white/30 transition-all"
          >
            {useBackgroundRemoval ? '🎭 Virtual Studio' : '💨 Blur Mode'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VirtualStudio;
