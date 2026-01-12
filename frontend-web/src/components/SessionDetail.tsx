
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Session, Message } from '../types/index';
import { STUDIO_AVATARS, STUDIO_VIDEO_PREVIEWS } from '../config/constants';
import * as sessionService from '../lib/api/session.service';

interface SessionDetailProps {
  session: Session;
  onBack: () => void;
  onUpdate: (updatedSession: Session) => void;
  onDelete: (id: string) => void;
}

const SessionDetail: React.FC<SessionDetailProps> = ({ session, onBack, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPairs, setSelectedPairs] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>(session.messages);
  const [showVideoReplay, setShowVideoReplay] = useState(false);
  const [summary, setSummary] = useState<string | undefined>(session.summary);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [activeSentence, setActiveSentence] = useState<string>('');
  const [replayWordIdx, setReplayWordIdx] = useState(-1);
  const [isReplayPaused, setIsReplayPaused] = useState(true);
  const [activeRole, setActiveRole] = useState<'ai' | 'user'>('ai');
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0);
  const [hoveredSegmentIdx, setHoveredSegmentIdx] = useState<number | null>(null);

  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [totalDurationMs, setTotalDurationMs] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    // Load messages from backend if session doesn't have them
    const loadMessages = async () => {
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
      } else {
        try {
          const backendMessages = await sessionService.getSessionMessages(session.id);
          const convertedMessages: Message[] = backendMessages.map(m => ({
            role: m.role as 'ai' | 'user',
            text: m.text,
            timestamp: m.timestamp,
            relativeOffset: m.relativeOffset,
            metadata: m.metadata,
          }));
          setMessages(convertedMessages);
        } catch (error) {
          console.error('Failed to load messages from backend:', error);
          setMessages(session.messages || []);
        }
      }
    };

    loadMessages();
  }, [session.id, session.messages]);

  // Transform messages into Q&A Pairs (Segments)
  const pairs = useMemo(() => {
    const p: { id: number; ai: Message; aiIdx: number; user?: Message; userIdx?: number; startTime: number; endTime: number; summary: string }[] = [];
    const msgs = messages;
    
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].role === 'ai') {
        const aiMsg = msgs[i];
        const userMsg = msgs[i + 1] && msgs[i + 1].role === 'user' ? msgs[i + 1] : undefined;
        
        const startTime = aiMsg.relativeOffset;
        const endTime = msgs[i + (userMsg ? 2 : 1)] 
          ? msgs[i + (userMsg ? 2 : 1)].relativeOffset 
          : (videoRef.current?.duration || 0) * 1000 || startTime + 5000;

        const summaryText = (aiMsg.text + " " + (userMsg?.text || "")).trim();
        const summary = summaryText.split(' ').slice(0, 10).join(' ') + (summaryText.split(' ').length > 10 ? '...' : '');

        p.push({
          id: p.length + 1,
          ai: aiMsg,
          aiIdx: i,
          user: userMsg,
          userIdx: userMsg ? i + 1 : undefined,
          startTime,
          endTime,
          summary
        });
        if (userMsg) i++;
      }
    }
    return p;
  }, [messages, totalDurationMs]);

  const getMessageSentences = (text: string) => {
    return text.match(/[^.!?]+[.!?]*/g) || [text];
  };

  const syncLoop = () => {
    if (!videoRef.current) return;
    
    const curr = videoRef.current.currentTime * 1000;
    setCurrentTimeMs(curr);
    
    // Determine active message and role
    let activeMsgIdx = 0;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].relativeOffset <= curr) {
        activeMsgIdx = i;
      } else {
        break;
      }
    }
    
    const msg = messages[activeMsgIdx];
    if (msg.role !== activeRole) setActiveRole(msg.role);

    // Determine current segment index for timeline
    let segmentIdx = pairs.findIndex(p => curr >= p.startTime && curr < p.endTime);
    if (segmentIdx === -1) segmentIdx = pairs.length - 1;
    if (segmentIdx !== currentSegmentIdx) setCurrentSegmentIdx(segmentIdx);

    // Precise Word Tracking for Closed Captions
    const sentences = getMessageSentences(msg.text);
    const msgStartTime = msg.relativeOffset;
    const msgEndTime = messages[activeMsgIdx + 1] 
      ? messages[activeMsgIdx + 1].relativeOffset 
      : (videoRef.current.duration || 0) * 1000;
      
    const msgDuration = Math.max(1, msgEndTime - msgStartTime);
    const timeInMsg = curr - msgStartTime;

    const sentenceIdx = Math.floor((timeInMsg / msgDuration) * sentences.length);
    const safeSentenceIdx = Math.max(0, Math.min(sentenceIdx, sentences.length - 1));
    const sentence = sentences[safeSentenceIdx];

    if (sentence !== activeSentence) setActiveSentence(sentence);

    const words = sentence.trim().split(/\s+/);
    const sentenceDuration = msgDuration / (sentences.length || 1);
    const timeInSentence = timeInMsg % sentenceDuration;
    const wordIdx = Math.floor((timeInSentence / sentenceDuration) * words.length);
    
    if (wordIdx !== replayWordIdx) setReplayWordIdx(wordIdx);

    requestRef.current = requestAnimationFrame(syncLoop);
  };

  useEffect(() => {
    if (showVideoReplay && !isReplayPaused) {
      requestRef.current = requestAnimationFrame(syncLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [showVideoReplay, isReplayPaused, messages, pairs]);

  const startReplay = () => {
    setShowVideoReplay(true);
    setIsReplayPaused(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    }, 150);
  };

  const jumpToSegment = (idx: number) => {
    if (!videoRef.current) return;
    const segmentStartMs = pairs[idx].startTime;
    videoRef.current.currentTime = segmentStartMs / 1000;
    setCurrentTimeMs(segmentStartMs);
    if (videoRef.current.paused) {
        videoRef.current.play();
        setIsReplayPaused(false);
    }
  };

  const togglePairSelection = (id: number) => {
    if (!isEditing) return;
    setSelectedPairs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleDeleteSelectedSegments = () => {
    if (selectedPairs.length === 0) return;
    if (!confirm(`Permanently remove ${selectedPairs.length} segment(s)?`)) return;
    
    const newMessages: Message[] = [];
    pairs.forEach(p => {
      if (!selectedPairs.includes(p.id)) {
        newMessages.push(p.ai);
        if (p.user) newMessages.push(p.user);
      }
    });
    
    setMessages(newMessages);
    setSelectedPairs([]);
    setIsEditing(false);
    onUpdate({ ...session, messages: newMessages });
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await sessionService.generateSessionSummary(session.id);
      setSummary(result.summary);
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col text-white font-sans overflow-hidden">
      <header className="px-8 py-5 border-b border-white/5 sticky top-0 bg-[#0a0c10] z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all text-white/50 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white/90 leading-none">Production Master</h1>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Archived Broadcast Feed</p>
          </div>
        </div>
        <div className="flex gap-4">
           {isEditing && selectedPairs.length > 0 && (
              <button onClick={handleDeleteSelectedSegments} className="px-6 py-2 bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-red-500 shadow-xl shadow-red-900/20 active:scale-95">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                 Delete ({selectedPairs.length})
              </button>
           )}
           <button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl active:scale-95 ${isGeneratingSummary ? 'bg-blue-700/50 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
           >
              {isGeneratingSummary ? (
                <>
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  AI Summary
                </>
              )}
           </button>
           <button onClick={startReplay} className="px-6 py-2 bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Cinematic Replay
           </button>
           <button onClick={() => { setIsEditing(!isEditing); setSelectedPairs([]); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-purple-600' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
              {isEditing ? 'Exit Editor' : 'Edit Script'}
           </button>
           <button onClick={(e) => { e.stopPropagation(); confirm("Destroy this broadcast archive?") && onDelete(session.id); }} className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
           </button>
        </div>
      </header>

      <div className="flex-1 px-8 py-10 overflow-y-auto custom-scrollbar bg-[#080808]">
        <div className="max-w-4xl mx-auto space-y-10">
           {showSummary && summary && (
             <div className="rounded-[2rem] p-10 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-blue-500/20 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-900/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white/90">AI-Generated Summary</h2>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Powered by Gemini AI</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSummary(false)}
                      className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all text-white/50 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-white/80 leading-relaxed whitespace-pre-wrap" style={{
                      fontFamily: 'inherit',
                    }}>
                      {summary.split('\n').map((line, idx) => {
                        if (line.startsWith('# ')) {
                          return <h1 key={idx} className="text-2xl font-black text-white/90 mt-6 mb-3">{line.replace('# ', '')}</h1>;
                        } else if (line.startsWith('## ')) {
                          return <h2 key={idx} className="text-xl font-black text-white/85 mt-5 mb-2">{line.replace('## ', '')}</h2>;
                        } else if (line.startsWith('### ')) {
                          return <h3 key={idx} className="text-lg font-bold text-white/80 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                        } else if (line.startsWith('**') && line.endsWith('**')) {
                          return <h4 key={idx} className="text-base font-bold text-blue-400 mt-4 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                        } else if (line.trim().startsWith('- ')) {
                          return <li key={idx} className="ml-6 text-white/75">{line.replace('- ', '')}</li>;
                        } else if (line.trim() === '') {
                          return <br key={idx} />;
                        } else {
                          return <p key={idx} className="text-white/75 mb-2">{line}</p>;
                        }
                      })}
                    </div>
                  </div>
                </div>
             </div>
           )}
           {pairs.map((pair) => (
             <div key={pair.id} className="relative flex items-start gap-8 group">
                <div className="w-16 text-5xl font-black text-white/5 group-hover:text-white/10 transition-all pt-2 text-right select-none">{pair.id}</div>
                <div 
                  className={`flex-1 rounded-[2rem] p-8 space-y-6 border transition-all relative ${isEditing ? 'cursor-pointer hover:scale-[1.01]' : ''} ${isEditing && selectedPairs.includes(pair.id) ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500/20 shadow-2xl' : 'bg-[#12161b] border-white/5 shadow-xl hover:border-white/10'}`} 
                  onClick={() => togglePairSelection(pair.id)}
                >
                   {isEditing && (
                      <div className={`absolute top-8 right-8 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedPairs.includes(pair.id) ? 'bg-purple-600 border-purple-400 scale-110 shadow-lg shadow-purple-900/40' : 'border-white/20'}`}>
                         {selectedPairs.includes(pair.id) && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                      </div>
                   )}
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <img src={STUDIO_AVATARS[session.vibe]} className="w-8 h-8 rounded-full object-cover border border-white/20" alt="" />
                         <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Host</span>
                      </div>
                      <p className="text-xl leading-relaxed text-white/90 font-medium">{pair.ai.text}</p>
                   </div>
                   {pair.user && (
                     <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black border border-white/20 shadow-lg shadow-emerald-900/20">G</div>
                           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">The Guest</span>
                        </div>
                        <p className="text-xl leading-relaxed text-white/70 italic font-medium">"{pair.user.text}"</p>
                     </div>
                   )}
                </div>
             </div>
           ))}
        </div>
      </div>

      {showVideoReplay && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col animate-in fade-in duration-500 overflow-hidden">
           <header className="p-10 flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-500 shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                 </div>
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white/90 leading-none">Production Replay</h2>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mt-2 italic">Broadcast Mastering Engine • 4K Native</p>
                 </div>
              </div>
              <button onClick={() => { setShowVideoReplay(false); setIsReplayPaused(true); if(videoRef.current) videoRef.current.pause(); }} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl hover:bg-white/10 transition-all text-white/40 hover:text-white active:scale-95">×</button>
           </header>
           
           <div className="flex-1 w-full flex flex-col items-center justify-center px-12 pb-12 relative overflow-hidden">
              {/* MIXED VIDEO PREVIEW: YouTube 16:9 standard width */}
              <div className="w-full max-w-4xl aspect-video relative rounded-2xl overflow-hidden bg-black shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 group">
                 <div className="absolute inset-0 z-0">
                    {/* HOST VIEW */}
                    <div className={`absolute inset-0 transition-all duration-200 ${activeRole === 'ai' ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
                       {/* Check if current AI message has animated video */}
                       {(() => {
                          const currentPair = pairs[currentSegmentIdx];
                          const currentAiMessage = currentPair?.ai;
                          const animatedVideoUrl = currentAiMessage?.metadata?.animatedVideoUrl;

                          if (animatedVideoUrl) {
                            // Show animated video
                            return (
                              <>
                                <video
                                  src={animatedVideoUrl}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  key={`avatar-${currentSegmentIdx}`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                                <div className="absolute top-12 left-12 flex items-center gap-3 px-5 py-2 rounded-full bg-purple-600/20 border border-purple-500/20 backdrop-blur-xl">
                                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">AI Animated • Host Camera</span>
                                </div>
                              </>
                            );
                          } else {
                            // Fallback to static image
                            return (
                              <>
                                <img src={STUDIO_AVATARS[session.vibe]} className="w-full h-full object-cover opacity-60" alt="" />
                                <video src={STUDIO_VIDEO_PREVIEWS[session.vibe]} className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen" autoPlay loop muted playsInline />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                <div className="absolute top-12 left-12 flex items-center gap-3 px-5 py-2 rounded-full bg-purple-600/20 border border-purple-500/20 backdrop-blur-xl">
                                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Host Camera</span>
                                </div>
                              </>
                            );
                          }
                       })()}
                    </div>

                    {/* GUEST VIEW (Actual recorded video) */}
                    <div className={`absolute inset-0 transition-all duration-200 ${activeRole === 'user' ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
                      <video 
                        ref={videoRef}
                        src={session.videoUrl} 
                        className="w-full h-full object-cover scale-x-[-1]"
                        playsInline
                        autoPlay
                        onLoadedMetadata={(e) => setTotalDurationMs(e.currentTarget.duration * 1000)}
                        onPause={() => setIsReplayPaused(true)}
                        onPlay={() => setIsReplayPaused(false)}
                      />
                      <div className="absolute top-12 left-12 flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-600/20 border border-emerald-500/20 backdrop-blur-xl">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Guest Camera</span>
                       </div>
                    </div>
                 </div>

                 {/* Subtitles - Bottom positioned, smaller size */}
                 <div className="absolute bottom-8 inset-x-0 px-8 text-center z-20 pointer-events-none">
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-4xl mx-auto bg-black/60 backdrop-blur-sm px-6 py-3 rounded-2xl">
                       {(activeSentence || "").split(/\s+/).map((word, idx) => (
                          <span
                            key={idx}
                            className={`text-2xl font-bold tracking-tight transition-all duration-200 ${
                              idx === replayWordIdx
                                ? 'text-emerald-400 scale-105'
                                : 'text-white/70'
                            }`}
                          >
                             {word}
                          </span>
                       ))}
                    </div>
                 </div>

                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 bg-black/40 backdrop-blur-[2px]">
                    <button 
                      onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
                      className="w-32 h-32 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                    >
                       {isReplayPaused ? <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="5" height="16"/><rect x="13" y="4" width="5" height="16"/></svg>}
                    </button>
                 </div>
              </div>

              {/* PROFESSIONAL SEGMENTED TIMELINE */}
              <div className="w-full max-w-5xl mt-16 px-4">
                 <div className="relative h-16 flex items-end">
                    <div className="flex w-full gap-2 h-4 items-end group/timeline">
                       {pairs.map((p, idx) => {
                          const widthPercent = ((p.endTime - p.startTime) / (totalDurationMs || 1)) * 100;
                          const playedPercent = Math.min(100, Math.max(0, (currentTimeMs - p.startTime) / (p.endTime - p.startTime) * 100));

                          return (
                             <div 
                               key={p.id} 
                               className="h-full relative cursor-pointer group/segment"
                               style={{ width: `${widthPercent}%` }}
                               onClick={() => jumpToSegment(idx)}
                               onMouseEnter={() => setHoveredSegmentIdx(idx)}
                               onMouseLeave={() => setHoveredSegmentIdx(null)}
                             >
                                {/* US-012: Purple gradient base with YouTube Stories style */}
                                <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-700/20 rounded-full transition-all group-hover/timeline:h-6 ${hoveredSegmentIdx === idx ? 'from-purple-500/40 to-purple-700/40 scale-105' : ''}`} />

                                {/* US-012: Purple gradient progress fill */}
                                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full transition-all group-hover/timeline:h-6 shadow-[0_0_20px_rgba(168,85,247,0.6)]" style={{ width: `${playedPercent}%` }} />

                                {/* Active segment glow indicator */}
                                {currentSegmentIdx === idx && (
                                   <div className="absolute -top-3 inset-x-0 h-1.5 bg-purple-400/70 rounded-full animate-pulse blur-[2px]" />
                                )}
                                
                                {/* US-012: Enhanced hover info popup with purple theme */}
                                {hoveredSegmentIdx === idx && (
                                   <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-72 p-6 bg-gradient-to-br from-purple-900/40 to-[#121418] border border-purple-500/20 rounded-3xl shadow-[0_30px_60px_rgba(168,85,247,0.3)] z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                                      <div className="flex items-center justify-between mb-4">
                                         <div className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-md border border-purple-500/20">Segment {p.id}</div>
                                         <div className="text-[10px] font-black text-white/30 tracking-widest">{Math.floor(p.startTime / 1000)}s - {Math.floor(p.endTime / 1000)}s</div>
                                      </div>
                                      <div className="text-sm font-bold text-white/90 leading-relaxed italic border-l-2 border-purple-500 pl-4">"{p.summary}"</div>
                                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-purple-900/40 to-[#121418] border-r border-b border-purple-500/20 rotate-45" />
                                   </div>
                                )}
                             </div>
                          );
                       })}
                    </div>
                 </div>
                 
                 <div className="flex justify-between items-center mt-8 text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">
                    <div className="flex items-center gap-4">
                       <span className="text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-lg border border-emerald-500/10 shadow-lg">{Math.floor(currentTimeMs / 1000)}s</span>
                       <span className="opacity-10 scale-150">/</span>
                       <span>{Math.floor(totalDurationMs / 1000)}s Total Duration</span>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,1)]" />
                          <span className="text-white/60">Broadcast Feed {activeRole === 'ai' ? '(Host)' : '(Guest)'}</span>
                       </div>
                       <span className="opacity-10">•</span>
                       <span className="text-white/80">Segment {currentSegmentIdx + 1} of {pairs.length}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetail;
