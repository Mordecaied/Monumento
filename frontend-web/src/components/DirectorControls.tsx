
import React, { useState, useRef } from 'react';
import { DirectorContext } from '../types/index';

interface DirectorControlsProps {
  context: DirectorContext;
  onChange: (context: DirectorContext) => void;
}

const DirectorControls: React.FC<DirectorControlsProps> = ({ context, onChange }) => {
  const [newTopic, setNewTopic] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const addTopic = () => {
    if (newTopic.trim()) {
      onChange({ ...context, topics: [...context.topics, newTopic.trim()] });
      setNewTopic('');
    }
  };

  const removeTopic = (index: number) => {
    onChange({ ...context, topics: context.topics.filter((_, i) => i !== index) });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange({ ...context, voiceSample: reader.result as string });
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording failed", err);
      alert("Please allow microphone access for voice training.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        processed++;

        if (processed === files.length) {
          onChange({ ...context, photos: [...context.photos, ...newPhotos] });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    onChange({ ...context, photos: context.photos.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 2. Voice Training */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">2. Voice Training (Optional)</h3>
          {context.voiceSample ? (
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-black rounded uppercase">Trained</span>
          ) : (
             <span className="px-2 py-0.5 bg-white/5 text-white/30 text-[9px] font-black rounded uppercase">Required for cloning</span>
          )}
        </div>
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <p className="text-xs text-white/40 leading-relaxed">
            {context.voiceSample 
              ? "Voice sample captured. Your host will now try to mimic your cadence."
              : "Read the sentence below. One sample is enough to calibrate the host."}
          </p>
          <div className={`bg-black/40 border transition-all p-6 rounded-xl text-center italic font-serif text-lg ${isRecording ? 'border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)] scale-[1.02]' : 'border-white/5 text-white/60'}`}>
            "The quick brown fox jumps over the lazy dog near the riverbank on a sunny afternoon."
          </div>
          <div className="flex gap-3">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                className={`px-4 py-2 bg-orange-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-orange-500 transition-all ${context.voiceSample ? 'opacity-50' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                {context.voiceSample ? 'Redo Sample' : 'Start Recording'}
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="px-4 py-2 bg-red-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-500 transition-all animate-pulse"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="10" x="7" y="7" rx="2"/></svg>
                Stop & Save
              </button>
            )}
            {context.voiceSample && !isRecording && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-bold text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-9 17l-5-5"/></svg>
                Calibration Complete
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Context Photos */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">3. Context Photos (Optional)</h3>
        </div>
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <p className="text-xs text-white/40 leading-relaxed">Upload photos and describe what's in them. The AI will ask questions about your photos.</p>
          <label className="w-full aspect-[4/1] bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 hover:border-orange-500/30 transition-all">
            <input type="file" className="hidden" multiple accept="image/*" onChange={handlePhotoUpload} />
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Add Photos</span>
          </label>
          {context.photos.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {context.photos.map((photo, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                  <img src={photo} alt={`Context ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Topics to Cover */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">4. Topics to Cover (Optional)</h3>
        </div>
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <p className="text-xs text-white/40 leading-relaxed">Add specific topics or questions you want the AI to explore</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTopic()}
              placeholder="e.g. Ask about the 1980s"
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50"
            />
            <button 
              onClick={addTopic}
              className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.topics.map((topic, i) => (
              <span key={i} className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-[11px] font-bold text-orange-400 flex items-center gap-2">
                {topic}
                <button onClick={() => removeTopic(i)} className="hover:text-white transition-colors">×</button>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DirectorControls;
