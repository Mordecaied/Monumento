
import React, { useEffect, useRef, useState } from 'react';
import { StudioVibe } from '../types/index';
import { DEFAULT_BACKGROUNDS } from '../config/constants';

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

  useEffect(() => {
    if (active && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    } else if (!active && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [active, stream]);

  useEffect(() => {
    if (!onFrame || !active || !stream) return;
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 400, 225);
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
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {active && stream ? (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="h-full w-full object-cover scale-x-[-1]"
            style={{
              maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/20">
            <div className="w-20 h-20 rounded-full border-2 border-current flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            </div>
            <span className="uppercase tracking-[0.3em] text-xs font-bold">Camera Standby</span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} width="400" height="225" className="hidden" />

      {/* Watermarks removed as requested for a cleaner broadcast aesthetic */}
      {active && (
        <div className="absolute top-6 left-6 px-4 py-2 rounded-full glass-panel flex items-center gap-3 z-20 border border-white/10 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[9px] font-black tracking-widest uppercase">Live Broadcast</span>
        </div>
      )}
    </div>
  );
};

export default VirtualStudio;
