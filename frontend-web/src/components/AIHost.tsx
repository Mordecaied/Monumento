
import React from 'react';
import { StudioVibe } from '../types/index';
import { STUDIO_AVATARS } from '../config/constants';

interface AIHostProps {
  vibe: StudioVibe;
  isTalking: boolean;
}

const AIHost: React.FC<AIHostProps> = ({ vibe, isTalking }) => {
  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl group">
        <img 
          src={STUDIO_AVATARS[vibe]} 
          alt="AI Host" 
          className={`w-full h-full object-cover transition-transform duration-700 ${isTalking ? 'scale-110' : 'scale-100'}`}
        />
        
        {/* Voice Visualization */}
        {isTalking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex items-end gap-1 h-12">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-400 mb-1 block">The Interviewer</span>
        <h2 className="text-2xl font-serif">PodHost AI</h2>
        <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isTalking ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span className="text-[10px] uppercase opacity-50">{isTalking ? 'Speaking...' : 'Listening'}</span>
        </div>
      </div>
    </div>
  );
};

export default AIHost;
