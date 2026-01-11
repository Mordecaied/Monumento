
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StudioVibe, InterviewMode, InterviewDuration, Message, Session, AppView, DirectorContext } from './types/index';
import { SYSTEM_INSTRUCTIONS, STUDIO_AVATARS, VOICE_MAPPING, STUDIO_VIDEO_PREVIEWS, HOST_PREVIEW_SCRIPTS, PREVIEW_VOICE_PARAMS } from './config/constants';
import VirtualStudio from './components/VirtualStudio';
import HistoryView from './components/HistoryView';
import SessionDetail from './components/SessionDetail';
import DirectorControls from './components/DirectorControls';
import AuthScreen from './components/AuthScreen';
import ContentShareModal from './components/ContentShareModal';
import { useAuth } from './contexts/AuthContext';
import { GeminiSession } from './services/geminiService';
import * as sessionService from './lib/api/session.service';
import JSZip from 'jszip';
import { LayoutManager, LayoutMode, LayoutConfig, LAYOUTS } from './services/layoutManager';

declare global {
  var aistudio: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
}

const PRICING_TIERS = [
  { id: 'express', name: 'Express', duration: 5, price: 'Free', description: 'Quick check-in or rapid life update.' },
  { id: 'deep-dive', name: 'Deep Dive', duration: 20, price: '$14.99', description: 'Comprehensive milestones exploration.' },
  { id: 'legacy', name: 'Legacy', duration: 60, price: '$49.99', description: 'The full cinematic biography archive.' },
];

const App: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const [view, setView] = useState<AppView>('SETUP');
  const [setupStep, setSetupStep] = useState<'mode' | 'config'>('mode');
  const [vibe, setVibe] = useState<StudioVibe | null>(null); 
  const [mode, setMode] = useState<InterviewMode>(InterviewMode.AUTO_PILOT);
  const [duration, setDuration] = useState<InterviewDuration>(20);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [animateAvatar, setAnimateAvatar] = useState<boolean>(false);
  const [directorContext, setDirectorContext] = useState<DirectorContext>({
    topics: [], photos: [], voiceSample: null
  });

  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [previewActive, setPreviewActive] = useState<StudioVibe | null>(null);
  const [hoveredVibe, setHoveredVibe] = useState<StudioVibe | null>(null);
  
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHostTalking, setIsHostTalking] = useState(false);
  const [isGuestTalking, setIsGuestTalking] = useState(false);
  const [countdown, setCountdown] = useState<number | string>(3);
  const [productionProgress, setProductionProgress] = useState(0);
  const [isContentShareOpen, setIsContentShareOpen] = useState(false);
  const [isPausedForUpload, setIsPausedForUpload] = useState(false);
  const [productionStep, setProductionStep] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(LAYOUTS.DEFAULT);
  const [sharedContent, setSharedContent] = useState<{ file: File; type: string; url: string } | null>(null);
  const layoutManagerRef = useRef<LayoutManager>(new LayoutManager((layout, event) => {
    setCurrentLayout(layout);
    console.log('[Layout] Changed to', layout.mode, 'at', event.relativeOffset, 'ms');
  }));
  
  const [history, setHistory] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('monumento_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const sessionRef = useRef<GeminiSession | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sharedStreamRef = useRef<MediaStream | null>(null);
  const volumeAnalysersRef = useRef<{ host: AnalyserNode | null; guest: AnalyserNode | null }>({ host: null, guest: null });
  const volumeRequestRef = useRef<number | null>(null);

  // Audio extraction for avatar animation
  const hostAudioRecorderRef = useRef<MediaRecorder | null>(null);
  const hostAudioChunksRef = useRef<{ messageIndex: number; chunks: Blob[] }[]>([]);
  const currentHostMessageIndexRef = useRef<number>(-1);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        setHasApiKey(await window.aistudio.hasSelectedApiKey());
      }
    };
    checkKey();
  }, []);

  // Load sessions from backend on mount
  useEffect(() => {
    const loadSessions = async () => {
      if (!isAuthenticated) return;

      try {
        const backendSessions = await sessionService.getUserSessions();

        // Convert backend sessions to frontend Session type
        const convertedSessions: Session[] = backendSessions.map(s => ({
          id: s.id,
          vibe: s.studioVibe as StudioVibe,
          mode: s.interviewMode as InterviewMode,
          duration: s.durationMinutes as InterviewDuration,
          createdAt: new Date(s.createdAt).getTime(),
          messages: [], // Messages will be loaded when viewing session detail
          videoUrl: undefined, // Video is stored locally
        }));

        setHistory(convertedSessions);
      } catch (error) {
        console.error('Failed to load sessions from backend:', error);
        // Fall back to localStorage if backend fails
      }
    };

    loadSessions();
  }, [isAuthenticated]);

  const handleSelectApiKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    const historyToSave = history.map(s => ({ ...s, videoUrl: undefined }));
    localStorage.setItem('monumento_history', JSON.stringify(historyToSave));
  }, [history]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (volumeRequestRef.current) {
        cancelAnimationFrame(volumeRequestRef.current);
      }
      sharedStreamRef.current?.getTracks().forEach(t => t.stop());
      sessionRef.current?.stop();
      mediaRecorderRef.current?.stop();
    };
  }, []);

  const volumeLoop = () => {
    const getLevel = (analyser: AnalyserNode | null) => {
      if (!analyser) return 0;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      return data.reduce((a, b) => a + b, 0) / data.length;
    };
    setIsGuestTalking(getLevel(volumeAnalysersRef.current.guest) > 15);
    setIsHostTalking(getLevel(volumeAnalysersRef.current.host) > 15);
    volumeRequestRef.current = requestAnimationFrame(volumeLoop);
  };

  const startStudioRecording = (guestStream: MediaStream, aiStream: MediaStream | null) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const mixedDest = audioCtx.createMediaStreamDestination();

      const guestSource = audioCtx.createMediaStreamSource(guestStream);
      guestSource.connect(mixedDest);
      const guestAnalyser = audioCtx.createAnalyser();
      guestAnalyser.fftSize = 256;
      guestSource.connect(guestAnalyser);
      volumeAnalysersRef.current.guest = guestAnalyser;

      if (aiStream) {
        const aiSource = audioCtx.createMediaStreamSource(aiStream);
        aiSource.connect(mixedDest);
        const hostAnalyser = audioCtx.createAnalyser();
        hostAnalyser.fftSize = 256;
        aiSource.connect(hostAnalyser);
        volumeAnalysersRef.current.host = hostAnalyser;

        // If avatar animation is enabled, record host audio separately
        if (animateAvatar) {
          try {
            const hostAudioRecorder = new MediaRecorder(aiStream, {
              mimeType: 'audio/webm;codecs=opus'
            });
            hostAudioRecorderRef.current = hostAudioRecorder;
            hostAudioChunksRef.current = [];

            hostAudioRecorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0 && currentHostMessageIndexRef.current >= 0) {
                // Find or create entry for this message
                const existingEntry = hostAudioChunksRef.current.find(
                  entry => entry.messageIndex === currentHostMessageIndexRef.current
                );
                if (existingEntry) {
                  existingEntry.chunks.push(e.data);
                } else {
                  hostAudioChunksRef.current.push({
                    messageIndex: currentHostMessageIndexRef.current,
                    chunks: [e.data]
                  });
                }
              }
            };

            hostAudioRecorder.start(100); // Collect data every 100ms
            console.log('[Avatar] Started recording host audio for animation');
          } catch (err) {
            console.error('[Avatar] Failed to start host audio recording:', err);
          }
        }
      }

      const finalStream = new MediaStream();
      guestStream.getVideoTracks().forEach(t => finalStream.addTrack(t));
      mixedDest.stream.getAudioTracks().forEach(t => finalStream.addTrack(t));

      const recorder = new MediaRecorder(finalStream, { mimeType: 'video/webm;codecs=vp8,opus' });
      mediaRecorderRef.current = recorder;
      videoChunksRef.current = [];
      recorder.ondataavailable = (e) => e.data && e.data.size > 0 && videoChunksRef.current.push(e.data);
      recorder.start(1000); 
      volumeLoop();
    } catch (err) {
      console.error("Recording setup failed", err);
    }
  };

  const initiateInterview = useCallback(async (stream: MediaStream) => {
    if (isInterviewing || !vibe) return;
    setIsInterviewing(true);
    const session = new GeminiSession();
    sessionRef.current = session;
    const voice = VOICE_MAPPING[vibe];
    const topicsStr = directorContext.topics.length > 0 ? ` Topics: ${directorContext.topics.join(', ')}.` : '';
    const instruction = `${SYSTEM_INSTRUCTIONS[vibe]}. Mode: ${mode}.${topicsStr} Duration: ${duration}min. Start immediately.`;

    const startTimestamp = Date.now();
    setSessionStartTime(startTimestamp);

    try {
      await session.connect(instruction, voice, stream, {
        onTranscript: (text, isUser) => {
          setMessages(prev => {
            const now = Date.now();
            const rel = now - startTimestamp;
            const role = isUser ? 'user' : 'ai';
            const last = prev[prev.length - 1];

            // If the last message was from the same role and happened within 3 seconds, append to it
            if (last && last.role === role && (now - last.timestamp) < 3000) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...last, text: last.text + ' ' + text };
              return updated;
            }

            const newMessages = [...prev, { role, text, timestamp: now, relativeOffset: rel }];

            // Track host message index for audio extraction
            if (role === 'ai' && animateAvatar) {
              currentHostMessageIndexRef.current = newMessages.length - 1;
            }

            return newMessages;
          });
        }
      });
      startStudioRecording(stream, session.getHostAudioStream());
    } catch (err) {
      console.error(err);
      setView('SETUP');
    }
  }, [vibe, mode, duration, isInterviewing, directorContext]);

  const handleStartInterview = useCallback(async () => {
    if (!vibe || !selectedTier) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true }, video: { width: 1280, height: 720 }
      });
      sharedStreamRef.current = stream;
      setView('COUNTDOWN');
      setCountdown(3);
      setMessages([]);
      let cur = 3;
      const interval = setInterval(() => {
        cur -= 1;
        if (cur > 0) setCountdown(cur);
        else if (cur === 0) {
          setCountdown("ACTION!");
          initiateInterview(stream);
        } else {
          clearInterval(interval);
          setView('RECORDING');
        }
      }, 1000);
    } catch (err) {
      alert("Camera/Mic access denied.");
    }
  }, [initiateInterview, vibe, selectedTier]);

  const handleEndSession = () => {
    sessionRef.current?.stop();
    if (volumeRequestRef.current) cancelAnimationFrame(volumeRequestRef.current);
    mediaRecorderRef.current?.stop();
    sharedStreamRef.current?.getTracks().forEach(t => t.stop());
    setIsInterviewing(false);
    setView('PRODUCING');
    setProductionProgress(0);
    const steps = ["Merging Video...", "Mastering Audio...", "Building Manifest...", "Finalizing Archive..."];
    const interval = setInterval(() => {
      setProductionProgress(p => {
        if (p >= 100) { clearInterval(interval); finalizeSession(); return 100; }
        setProductionStep(steps[Math.floor(p / 25)]);
        return p + 1;
      });
    }, 20);
  };

  const handleShareContent = async (file: File, type: 'image' | 'document' | 'video' | 'audio') => {
    // Pause recording
    setIsPausedForUpload(true);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }

    try {
      // Create object URL for immediate display
      const contentUrl = URL.createObjectURL(file);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('timestamp', String(Date.now() - sessionStartTime));

      // TODO: Upload to backend (backend implementation needed)
      console.log('Uploading content:', file.name, type);

      // Switch layout to show content
      const currentTimestamp = Date.now() - sessionStartTime;
      const layoutEvent = layoutManagerRef.current.autoSwitchForContent(type, currentTimestamp);

      // Set shared content for display
      setSharedContent({ file, type, url: contentUrl });

      // Store in message metadata with layout change event
      const newMessage: Message = {
        role: 'user',
        text: `[Shared ${type}: ${file.name}]`,
        timestamp: Date.now(),
        relativeOffset: currentTimestamp,
        duration: 0,
        metadata: {
          attachmentType: type,
          attachmentName: file.name,
          attachmentUrl: contentUrl,
          attachmentSize: file.size,
          attachmentTimestamp: currentTimestamp,
          compositionEvents: [
            {
              type: 'layout_change',
              timestamp: layoutEvent.timestamp,
              relativeOffset: layoutEvent.relativeOffset,
              fromLayout: layoutEvent.fromLayout,
              toLayout: layoutEvent.toLayout,
              reason: layoutEvent.reason
            }
          ]
        }
      };

      setMessages(prev => [...prev, newMessage]);

    } catch (error) {
      console.error('Failed to share content:', error);
    } finally {
      // Resume recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      setIsPausedForUpload(false);
    }
  };

  const handleCloseContent = () => {
    if (sharedContent) {
      URL.revokeObjectURL(sharedContent.url);
    }
    setSharedContent(null);

    // Return to default layout
    const currentTimestamp = Date.now() - sessionStartTime;
    layoutManagerRef.current.returnToDefault(currentTimestamp);
  };

  const generatePlainTextTranscript = (msgs: Message[]) => {
    return msgs.map(m => {
      const speaker = m.role === 'ai' ? 'HOST' : 'GUEST';
      const timestamp = new Date(m.timestamp).toLocaleTimeString();
      return `[${timestamp}] ${speaker}: ${m.text}`;
    }).join('\n\n');
  };

  const finalizeSession = async () => {
    if (!vibe) return;
    const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const sessionId = Date.now().toString();
    const videoUrl = videoBlob.size > 0 ? URL.createObjectURL(videoBlob) : undefined;

    const finalMessages = messages.map(m => ({ ...m }));
    const newSession: Session = {
      id: sessionId, vibe, mode, duration, createdAt: Date.now(),
      messages: finalMessages,
      videoUrl
    };

    // Save session to backend
    try {
      setProductionStep("Saving to cloud...");

      // Debug logging
      console.log('🎬 Creating session with avatar animation:', animateAvatar);
      console.log('📦 Session request:', { vibe, mode, durationMinutes: duration, metadata: { animateAvatar } });

      const savedSession = await sessionService.createSession({
        vibe: vibe,
        mode: mode,
        durationMinutes: duration,
        metadata: {
          animateAvatar: animateAvatar,
        },
      });

      console.log('✅ Session created:', savedSession.id, 'Metadata:', savedSession.metadata);

      // Save all messages to the session
      const savedMessages: any[] = [];
      for (const msg of finalMessages) {
        const savedMsg = await sessionService.createMessage(savedSession.id, {
          role: msg.role,
          text: msg.text,
          relativeOffset: msg.relativeOffset || 0,
        });
        savedMessages.push(savedMsg);
      }

      // If avatar animation is enabled, upload host audio segments
      if (animateAvatar && hostAudioChunksRef.current.length > 0) {
        setProductionStep("Uploading host audio segments...");
        console.log(`[Avatar] Uploading ${hostAudioChunksRef.current.length} audio segments`);

        for (const audioEntry of hostAudioChunksRef.current) {
          const messageIndex = audioEntry.messageIndex;
          const audioBlob = new Blob(audioEntry.chunks, { type: 'audio/webm;codecs=opus' });

          if (audioBlob.size > 0 && savedMessages[messageIndex]) {
            try {
              // Upload audio and get URL
              const audioUrl = await sessionService.uploadAudio(
                audioBlob,
                savedSession.id,
                savedMessages[messageIndex].id
              );

              // Update message with audio URL
              await sessionService.updateMessageAudio(
                savedSession.id,
                savedMessages[messageIndex].id,
                audioUrl
              );

              console.log(`[Avatar] Uploaded audio for message ${messageIndex}, size: ${audioBlob.size} bytes`);
            } catch (err) {
              console.error(`[Avatar] Failed to upload audio for message ${messageIndex}:`, err);
            }
          }
        }
      }

      // Update local session with backend ID
      newSession.id = savedSession.id;
    } catch (error) {
      console.error('Failed to save session to backend:', error);
      // Continue with local save even if backend fails
    }

    setHistory(h => [newSession, ...h]);

    // Create bundled ZIP file
    const zip = new JSZip();

    // Add video file
    if (videoBlob.size > 0) {
      zip.file('video.webm', videoBlob);
    }

    // Add metadata JSON
    zip.file('metadata.json', JSON.stringify(newSession, null, 2));

    // Add plain text transcript
    zip.file('transcript.txt', generatePlainTextTranscript(finalMessages));

    // Add README
    const readme = `# Monumento Session Archive

## Session Details
- ID: ${sessionId}
- Host: ${vibe}
- Mode: ${mode}
- Duration: ${duration} minutes
- Date: ${new Date(newSession.createdAt).toLocaleString()}

## Files Included
- video.webm - Full recording with side-by-side view
- transcript.txt - Plain text transcript with timestamps
- metadata.json - Complete session data (JSON format)

Generated by Monumento - AI Podcast Studio
https://monumento.app
`;
    zip.file('README.md', readme);

    // Generate and download ZIP
    setProductionStep("Packaging files...");
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `monumento_session_${sessionId}.zip`;
    link.click();

    setProductionStep("Production Package Ready");
  };

  const handlePlayPreview = (targetVibe: StudioVibe) => {
    window.speechSynthesis.cancel();
    setPreviewActive(targetVibe);
    const utterance = new SpeechSynthesisUtterance(HOST_PREVIEW_SCRIPTS[targetVibe]);
    const params = PREVIEW_VOICE_PARAMS[targetVibe];
    utterance.pitch = params.pitch;
    utterance.rate = params.rate;

    // Try to select a voice that matches the gender for better preview accuracy
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchingVoice = voices.find(v =>
        v.name.toLowerCase().includes(params.gender) ||
        v.name.toLowerCase().includes(params.gender === 'male' ? 'david' : 'samantha')
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    utterance.onend = () => setPreviewActive(null);
    window.speechSynthesis.speak(utterance);
  };

  // Show auth screen if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] studio-gradient flex items-center justify-center">
        <div className="text-white text-xl font-bold tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!hasApiKey) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-black"><h1 className="text-6xl font-black mb-8 opacity-90">Monumento</h1><button onClick={handleSelectApiKey} className="px-8 py-4 bg-purple-600 rounded-xl font-black uppercase tracking-widest text-xs">Select Paid API Key</button></div>;
  if (view === 'COUNTDOWN') return <div className="min-h-screen flex items-center justify-center bg-black text-white text-center"><div className="space-y-12"><div className="text-[12px] uppercase tracking-[1em] opacity-40 font-bold">Studio Live In</div><div className="text-[12rem] font-black tracking-tighter">{countdown}</div></div></div>;

  if (view === 'RECORDING') {
    return (
      <div className="h-screen bg-[#050505] flex flex-col overflow-hidden studio-gradient">
        <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-12 z-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90">Studio 01 • BROADCASTING</span>
              {isPausedForUpload && (
                <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400 animate-pulse">⏸ PAUSED FOR UPLOAD</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsContentShareOpen(true)}
              className="px-6 py-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-600/30 hover:border-purple-500/50 transition-all shadow-xl shadow-purple-900/20 active:scale-95 flex items-center gap-2"
            >
              <span>📤</span>
              <span>Share Content</span>
            </button>
            <button onClick={handleEndSession} className="px-8 py-2.5 bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl shadow-red-900/20 active:scale-95">Wrap Session</button>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden relative">
          {/* DEFAULT LAYOUT: 3-column grid */}
          {currentLayout.mode === 'DEFAULT' && (
            <>
              {/* SIDE-BY-SIDE: HOST (LEFT) */}
              <div className="col-span-4 relative border-r border-white/5 bg-[#0a0a0a] flex flex-col items-center justify-center p-12 overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 z-0 opacity-20 blur-xl scale-110">
                  <img src={STUDIO_AVATARS[vibe!]} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="relative z-10 w-full max-w-sm aspect-square rounded-full overflow-hidden border-4 border-white/10 shadow-[0_0_80px_rgba(0,0,0,1)] ring-1 ring-white/20 transition-all duration-500 transform">
                  <img src={STUDIO_AVATARS[vibe!]} className="w-full h-full object-cover" alt="" />
                  <video src={STUDIO_VIDEO_PREVIEWS[vibe!]} className={`absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-300 ${isHostTalking ? 'opacity-30' : 'opacity-0'}`} autoPlay loop muted playsInline />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="mt-10 text-center space-y-2 relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400">Broadcast Host</div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white/90">{vibe}</h2>
                  <div className="flex justify-center gap-1.5 h-6 items-end mt-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`w-1 rounded-full transition-all duration-75 bg-purple-500 ${isHostTalking ? 'animate-bounce' : 'h-1 opacity-20'}`} style={{ height: isHostTalking ? `${30 + Math.random() * 70}%` : '4px', animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* SIDE-BY-SIDE: TRANSCRIPT (MIDDLE) */}
              <div className="col-span-4 flex flex-col bg-black/60 border-x border-white/5 overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                  {messages.length === 0 && <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] opacity-20 text-center px-12 italic">Waiting for connection...</div>}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${m.role === 'ai' ? 'text-purple-400' : 'text-emerald-400'}`}>{m.role === 'ai' ? 'Host' : 'Guest'}</span>
                      <div className={`p-6 rounded-2xl max-w-[95%] text-lg font-medium border leading-relaxed shadow-lg ${m.role === 'ai' ? 'bg-[#121212] border-white/5 text-white/90' : 'bg-emerald-600/5 border-emerald-500/10 text-white/70 italic'}`}>{m.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* SIDE-BY-SIDE: GUEST (RIGHT) */}
              <div className="col-span-4 relative bg-[#0a0a0a] flex flex-col items-center justify-center p-12 overflow-hidden">
                <div className="relative z-10 w-full max-w-sm aspect-square rounded-full overflow-hidden border-4 border-white/10 shadow-[0_0_80px_rgba(0,0,0,1)] ring-1 ring-white/20 bg-black">
                  <VirtualStudio vibe={vibe!} customBackground={null} active={true} stream={sharedStreamRef.current} onFrame={(f) => sessionRef.current?.sendImageFrame(f)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="mt-10 text-center space-y-2 relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400">Guest Feed</div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white/90">The Guest</h2>
                  <div className="flex justify-center gap-1.5 h-6 items-end mt-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`w-1 rounded-full transition-all duration-75 bg-emerald-500 ${isGuestTalking ? 'animate-bounce' : 'h-1 opacity-20'}`} style={{ height: isGuestTalking ? `${30 + Math.random() * 70}%` : '4px', animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CONTENT SHARED LAYOUT: Content dominant with PiP speakers */}
          {(currentLayout.mode === 'CONTENT_SHARED' || currentLayout.mode === 'SCREEN_SHARE') && sharedContent && (
            <div className="col-span-12 relative bg-black flex items-center justify-center p-12 animate-in fade-in duration-300">
              {/* Shared Content Display */}
              <div className="w-full h-full flex items-center justify-center">
                {sharedContent.type === 'image' && (
                  <img src={sharedContent.url} alt={sharedContent.file.name} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                )}
                {sharedContent.type === 'video' && (
                  <video src={sharedContent.url} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl" />
                )}
                {sharedContent.type === 'audio' && (
                  <div className="bg-gradient-to-br from-purple-900/40 to-emerald-900/40 p-16 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="text-center space-y-6">
                      <div className="w-24 h-24 mx-auto rounded-full bg-purple-600/20 border-4 border-purple-500/40 flex items-center justify-center">
                        <span className="text-6xl">🎵</span>
                      </div>
                      <h3 className="text-2xl font-black text-white/90">{sharedContent.file.name}</h3>
                      <audio src={sharedContent.url} controls className="mt-6 w-96" />
                    </div>
                  </div>
                )}
                {sharedContent.type === 'document' && (
                  <div className="bg-gradient-to-br from-emerald-900/40 to-blue-900/40 p-16 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="text-center space-y-6">
                      <div className="w-32 h-40 mx-auto rounded-2xl bg-white flex items-center justify-center border-4 border-white/20 shadow-xl">
                        <span className="text-8xl">📄</span>
                      </div>
                      <h3 className="text-2xl font-black text-white/90">{sharedContent.file.name}</h3>
                      <p className="text-sm text-white/60">Document preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseContent}
                className="absolute top-8 right-8 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl z-40"
              >
                Close Content
              </button>

              {/* PiP: Guest (Bottom Left) */}
              <div className="absolute bottom-6 left-6 w-40 h-40 rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl z-30 bg-black">
                <VirtualStudio vibe={vibe!} customBackground={null} active={true} stream={sharedStreamRef.current} onFrame={(f) => sessionRef.current?.sendImageFrame(f)} />
                {isGuestTalking && (
                  <div className="absolute inset-0 border-4 border-emerald-400 rounded-xl pointer-events-none animate-pulse" />
                )}
                <div className="absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-black/60 px-2 py-1 rounded">
                  Guest
                </div>
              </div>

              {/* PiP: Host (Bottom Left, above guest) */}
              <div className="absolute bottom-56 left-6 w-40 h-40 rounded-xl overflow-hidden border-2 border-purple-500/40 shadow-2xl z-30 bg-[#0a0a0a]">
                <div className="w-full h-full flex items-center justify-center">
                  <img src={STUDIO_AVATARS[vibe!]} className="w-full h-full object-cover" alt="" />
                  <video src={STUDIO_VIDEO_PREVIEWS[vibe!]} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHostTalking ? 'opacity-30' : 'opacity-0'}`} autoPlay loop muted playsInline />
                </div>
                {isHostTalking && (
                  <div className="absolute inset-0 border-4 border-purple-400 rounded-xl pointer-events-none animate-pulse" />
                )}
                <div className="absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-wider text-purple-400 bg-black/60 px-2 py-1 rounded">
                  Host
                </div>
              </div>
            </div>
          )}
        </main>

        <ContentShareModal
          isOpen={isContentShareOpen}
          onClose={() => setIsContentShareOpen(false)}
          onShare={handleShareContent}
        />
      </div>
    );
  }

  if (view === 'PRODUCING') return <div className="min-h-screen bg-black flex items-center justify-center p-6 text-white"><div className="max-w-md w-full glass-panel p-12 rounded-3xl text-center space-y-8"><h1 className="text-2xl font-black uppercase tracking-widest">Mastering Export</h1><div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-purple-600 transition-all" style={{ width: `${productionProgress}%` }} /></div><div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">{productionStep}</div>{productionProgress === 100 && <button onClick={() => setView('HISTORY')} className="w-full py-4 bg-emerald-600 rounded-xl font-black uppercase tracking-widest text-[10px]">View Archives</button>}</div></div>;
  if (view === 'HISTORY') return <HistoryView sessions={history} onSelect={(s) => { setSelectedSession(s); setView('SESSION_DETAIL'); }} onBack={() => setView('SETUP')} onDeleteAll={() => setHistory([])} onDeleteSingle={(id) => setHistory(h => h.filter(s => s.id !== id))} />;
  if (view === 'SESSION_DETAIL' && selectedSession) return <SessionDetail session={selectedSession} onBack={() => setView('HISTORY')} onUpdate={(u) => setHistory(h => h.map(s => s.id === u.id ? u : s))} onDelete={(id) => { setHistory(h => h.filter(s => s.id !== id)); setView('HISTORY'); }} />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar studio-gradient">
      {/* Logout button in top right */}
      {user && (
        <div className="absolute top-8 right-8 z-50">
          <button
            onClick={logout}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <span className="text-white/60">{user.email}</span>
            <span className="text-white/40">•</span>
            <span>Logout</span>
          </button>
        </div>
      )}

      {setupStep === 'mode' ? (
        <div className="w-full max-w-4xl space-y-16 animate-in fade-in duration-700">
          <div className="text-center space-y-4">
            <h1 className="text-8xl font-black tracking-tighter text-white/90 drop-shadow-2xl">Monumento</h1>
            <p className="text-white/40 font-bold uppercase tracking-[0.5em] text-[10px]">Professional AI Podcast Studio</p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <button onClick={() => { setMode(InterviewMode.AUTO_PILOT); setSetupStep('config'); }} className="glass-panel p-16 rounded-[2.5rem] text-center space-y-6 hover:border-purple-500 hover:scale-[1.02] transition-all group active:scale-95">
              <h3 className="text-4xl font-black uppercase tracking-tighter group-hover:text-purple-400 transition-colors">Auto-Pilot</h3>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Autonomous Interview Engine</p>
            </button>
            <button onClick={() => { setMode(InterviewMode.DIRECTOR); setSetupStep('config'); }} className="glass-panel p-16 rounded-[2.5rem] text-center space-y-6 hover:border-emerald-500 hover:scale-[1.02] transition-all group active:scale-95">
              <h3 className="text-4xl font-black uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">Director</h3>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Custom Topics Control</p>
            </button>
          </div>
          <button onClick={() => setView('HISTORY')} className="px-12 py-4 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.3em] mx-auto block hover:bg-white/10 transition-all">Archives</button>
        </div>
      ) : (
        <div className="w-full max-w-6xl space-y-16 py-20 flex flex-col">
          <button onClick={() => setSetupStep('mode')} className="w-fit text-white/30 hover:text-white uppercase text-[10px] font-black tracking-widest mb-4">← Return</button>
          
          <section className="space-y-10">
            <div className="flex items-center gap-6">
               <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white/50">01 • Select Studio Host</h3>
               <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Voice previews are approximate. Actual interview voices will be higher quality and match your host's personality.</span>
            </div>
            <div className="grid grid-cols-5 gap-8">
              {Object.values(StudioVibe).map(v => (
                <div key={v} onMouseEnter={() => setHoveredVibe(v)} onMouseLeave={() => setHoveredVibe(null)} onClick={() => setVibe(v)}
                  className={`group relative aspect-[3/4.5] rounded-3xl overflow-hidden border-2 transition-all duration-500 cursor-pointer 
                    ${vibe === v ? 'border-purple-600 shadow-[0_0_60px_rgba(147,51,234,0.3)] scale-105 z-10' : 'border-white/5 grayscale hover:grayscale-0 hover:border-white/20 hover:scale-105'}`}
                >
                  <img src={STUDIO_AVATARS[v]} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${hoveredVibe === v ? 'opacity-0' : 'opacity-100'}`} alt="" />
                  {hoveredVibe === v && <video src={STUDIO_VIDEO_PREVIEWS[v]} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-[2px]">
                    <button onClick={(e) => { e.stopPropagation(); handlePlayPreview(v); }} className="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all">
                       {previewActive === v ? 'Broadcasting...' : 'Voice Test'}
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-6 font-black uppercase text-xs tracking-widest z-10 text-white/90">{v}</div>
                </div>
              ))}
            </div>
          </section>

          {vibe && (
            <section className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-6">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white/50">02 • The Ticket Booth</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="grid grid-cols-3 gap-10">
                {PRICING_TIERS.map(tier => (
                  <div key={tier.id} onClick={() => { setSelectedTier(tier.id); setDuration(tier.duration as InterviewDuration); }}
                    className={`glass-panel p-10 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer text-center space-y-6 group
                      ${selectedTier === tier.id ? 'border-purple-600 bg-purple-600/5 scale-[1.05]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <div className="text-[11px] font-black uppercase tracking-widest text-purple-400">{tier.duration} MINS</div>
                    <h4 className="text-3xl font-black uppercase tracking-tighter group-hover:text-purple-400 transition-colors">{tier.name}</h4>
                    <div className="text-2xl font-serif italic text-white/80">{tier.price}</div>
                    <p className="text-[11px] text-white/40 uppercase tracking-widest leading-relaxed px-4">{tier.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {mode === InterviewMode.DIRECTOR && vibe && <DirectorControls context={directorContext} onChange={setDirectorContext} />}

          {vibe && selectedTier && (
            <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-6">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white/50">03 • Avatar Enhancement</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div
                onClick={() => setAnimateAvatar(!animateAvatar)}
                className={`glass-panel p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer group
                  ${animateAvatar ? 'border-blue-600 bg-blue-600/5' : 'border-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-start gap-6">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${animateAvatar ? 'bg-blue-600 border-blue-400 scale-110' : 'border-white/30'}`}>
                    {animateAvatar && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors">Animate Host Avatar</h4>
                      <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-[9px] font-black uppercase tracking-widest text-blue-400">AI-Powered</span>
                      {animateAvatar && <span className="px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-full text-[9px] font-black uppercase tracking-widest text-green-400">Enabled</span>}
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">
                      Generate lifelike host videos with realistic facial expressions, lip-sync, and head movements using SadTalker AI.
                      The host will appear to speak naturally in your cinematic replay.
                    </p>
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="uppercase tracking-widest">+2-3 min processing</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
                        <span className="uppercase tracking-widest">Free (Powered by HuggingFace)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-col items-center gap-6 pt-10">
             <button onClick={handleStartInterview} disabled={!vibe || !selectedTier} 
               className="px-20 py-6 bg-purple-600 rounded-2xl font-black uppercase tracking-[0.4em] text-xs hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shadow-2xl shadow-purple-900/40">
               Enter Production Studio
             </button>
             <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Media Capture will start automatically upon entry</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
