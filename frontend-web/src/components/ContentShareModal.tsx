import React, { useState, useRef } from 'react';

interface ContentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (file: File, type: 'image' | 'document' | 'video' | 'audio') => void;
}

export default function ContentShareModal({ isOpen, onClose, onShare }: ContentShareModalProps) {
  const [selectedType, setSelectedType] = useState<'image' | 'document' | 'video' | 'audio' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTypeSelect = (type: 'image' | 'document' | 'video' | 'audio') => {
    setSelectedType(type);
    // Trigger file input
    if (fileInputRef.current) {
      const acceptTypes = {
        image: 'image/*',
        document: '.pdf,.doc,.docx,.txt,.ppt,.pptx',
        video: 'video/*',
        audio: 'audio/*'
      };
      fileInputRef.current.accept = acceptTypes[type];
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedType) {
      onShare(file, selectedType);
      setSelectedType(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Share Content</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors text-2xl font-light"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleTypeSelect('image')}
            className="w-full p-4 bg-purple-600/10 border border-purple-500/20 rounded-xl text-left hover:bg-purple-600/20 hover:border-purple-500/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 text-xl">
                🖼️
              </div>
              <div>
                <div className="font-black text-sm uppercase tracking-wider text-white group-hover:text-purple-400 transition-colors">
                  Upload Image
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  JPG, PNG, GIF, WebP
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleTypeSelect('document')}
            className="w-full p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-left hover:bg-emerald-600/20 hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-xl">
                📄
              </div>
              <div>
                <div className="font-black text-sm uppercase tracking-wider text-white group-hover:text-emerald-400 transition-colors">
                  Upload Document
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  PDF, DOC, DOCX, TXT, PPT
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleTypeSelect('video')}
            className="w-full p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl text-left hover:bg-blue-600/20 hover:border-blue-500/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-xl">
                🎥
              </div>
              <div>
                <div className="font-black text-sm uppercase tracking-wider text-white group-hover:text-blue-400 transition-colors">
                  Upload Video
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  MP4, WebM, MOV
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleTypeSelect('audio')}
            className="w-full p-4 bg-yellow-600/10 border border-yellow-500/20 rounded-xl text-left hover:bg-yellow-600/20 hover:border-yellow-500/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center text-yellow-400 text-xl">
                🎵
              </div>
              <div>
                <div className="font-black text-sm uppercase tracking-wider text-white group-hover:text-yellow-400 transition-colors">
                  Upload Audio
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  MP3, WAV, OGG
                </div>
              </div>
            </div>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}
