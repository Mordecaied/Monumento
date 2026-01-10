
import React from 'react';
import { Session } from '../types/index';

interface HistoryViewProps {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onBack: () => void;
  onDeleteAll: () => void;
  onDeleteSingle?: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ sessions, onSelect, onBack, onDeleteAll, onDeleteSingle }) => {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <header className="px-8 py-12 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-5xl font-black tracking-tight mb-2 text-white/90">Interview History</h1>
          <p className="text-white/40 font-medium tracking-wide">Review your past podcast sessions and transcripts</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); confirm("Delete all sessions permanently?") && onDeleteAll(); }}
            className="px-6 py-3 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl font-bold flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            Delete All
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            New Session
          </button>
        </div>
      </header>

      <div className="flex-1 px-8 pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4">
          {sessions.map(session => (
            <div 
              key={session.id} 
              onClick={() => onSelect(session)}
              className="group glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${session.vibe.includes('Historian') ? 'bg-orange-500/20 text-orange-500' : 'bg-purple-500/20 text-purple-500'}`}>
                        {session.vibe}
                     </span>
                     <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Archive</span>
                  </div>
                  <h3 className="text-xl font-bold text-white/90">Session: {new Date(session.createdAt).toLocaleDateString()}</h3>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                     <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                     </div>
                     <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {new Date(session.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    className="px-6 py-2.5 bg-black/40 border border-white/10 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-white/5 transition-all text-white/80"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    View
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); confirm("Delete this session archive?") && onDeleteSingle?.(session.id); }}
                    className="p-2.5 text-white/10 hover:text-red-500 transition-colors"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
               </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="py-24 text-center space-y-4">
              <div className="text-6xl opacity-10 font-black">EMPTY VAULT</div>
              <p className="text-white/30 font-medium tracking-wide">Your recorded sessions will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
