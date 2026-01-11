
export enum StudioVibe {
  HISTORIAN = 'The Historian',
  CELEBRATOR = 'The Celebrator',
  JOURNALIST = 'The Journalist',
  JESTER = 'The Jester',
  ROAST_MASTER = 'The Roast Master'
}

export enum InterviewMode {
  AUTO_PILOT = 'Auto-Pilot',
  DIRECTOR = 'Director Mode'
}

export type InterviewDuration = 5 | 20 | 60;

export interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  relativeOffset: number; // ms from start of recording
  duration?: number;
  metadata?: {
    attachmentType?: 'image' | 'document' | 'video' | 'audio';
    attachmentName?: string;
    attachmentUrl?: string;
    attachmentSize?: number;
    attachmentTimestamp?: number;
    [key: string]: any; // Allow other metadata fields
  };
}

export interface Session {
  id: string;
  vibe: StudioVibe;
  mode: InterviewMode;
  duration: number;
  messages: Message[];
  createdAt: number;
  videoUrl?: string; 
}

export type AppView = 'SETUP' | 'COUNTDOWN' | 'RECORDING' | 'PRODUCING' | 'HISTORY' | 'SESSION_DETAIL';

export interface DirectorContext {
  topics: string[];
  photos: string[];
  voiceSample: string | null;
}
