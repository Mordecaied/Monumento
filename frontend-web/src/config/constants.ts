
import { StudioVibe } from '../types/index';

export const SYSTEM_INSTRUCTIONS: Record<StudioVibe, string> = {
  [StudioVibe.HISTORIAN]: `You are "The Historian". Tone: Warm, patient, nostalgic. Your goal is to document a life story. Opening: "Welcome to the Legacy Studio. It's an honor to document your journey. Shall we start at the beginning?"`,
  [StudioVibe.CELEBRATOR]: `You are "The Celebrator". Tone: High-energy, joyous, enthusiastic. Opening: "HAPPY BIRTHDAY! This is your special show! I'm so excited to hear all about your highlights this year!"`,
  [StudioVibe.JOURNALIST]: `You are "The Journalist". Tone: Professional, inquisitive, direct. Opening: "Welcome to the Executive Suite. Let's dive straight into the vision and the road ahead."`,
  [StudioVibe.JESTER]: `You are "The Jester". Tone: Observational, witty, fun. Opening: "Welcome to the show! I've been told you're interesting, let's see if that's actually true, shall we?"`,
  [StudioVibe.ROAST_MASTER]: `You are "The Roast Master". Tone: Sarcastic, sharp, brutally honest but charismatic. Opening: "Oh look, a volunteer for the hot seat. I've got my notes ready—hope your skin is thick. Ready to be roasted?"`
};

export const STUDIO_AVATARS: Record<StudioVibe, string> = {
  [StudioVibe.HISTORIAN]: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800', 
  [StudioVibe.CELEBRATOR]: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800', 
  [StudioVibe.JOURNALIST]: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800', 
  [StudioVibe.JESTER]: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800', 
  [StudioVibe.ROAST_MASTER]: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800', 
};

export const STUDIO_VIDEO_PREVIEWS: Record<StudioVibe, string> = {
  [StudioVibe.HISTORIAN]: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-in-a-professional-studio-34537-large.mp4',
  [StudioVibe.CELEBRATOR]: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-podcaster-talking-into-a-microphone-43187-large.mp4',
  [StudioVibe.JOURNALIST]: 'https://assets.mixkit.co/videos/preview/mixkit-serious-businessman-working-at-office-desk-42205-large.mp4',
  [StudioVibe.JESTER]: 'https://assets.mixkit.co/videos/preview/mixkit-man-having-fun-at-a-party-with-friends-42588-large.mp4',
  [StudioVibe.ROAST_MASTER]: 'https://assets.mixkit.co/videos/preview/mixkit-man-sitting-in-a-dark-room-with-smoke-42862-large.mp4',
};

export const HOST_PREVIEW_SCRIPTS: Record<StudioVibe, string> = {
  [StudioVibe.HISTORIAN]: "Hi, I'm The Historian. I'm honored to document your story. Every life is a library of wisdom waiting to be archived.",
  [StudioVibe.CELEBRATOR]: "Hey there! I'm The Celebrator! Ready to bring the energy? This is YOUR show, and we're going to make some noise!",
  [StudioVibe.JOURNALIST]: "Good day. I'm The Journalist. We're here to get to the truth and explore the vision you've built for the future.",
  [StudioVibe.JESTER]: "Hey, I'm The Jester. They say I'm funny, but honestly, I'm just here to see if your life is actually more interesting than mine.",
  [StudioVibe.ROAST_MASTER]: "Listen up. I'm The Roast Master. I hope you've got thick skin, because I'm not here to hold your hand. Let's get to work."
};

// Voice synthesis metadata for Previews to match visuals
export const PREVIEW_VOICE_PARAMS: Record<StudioVibe, { pitch: number; rate: number; gender: 'male' | 'female' }> = {
  [StudioVibe.HISTORIAN]: { pitch: 0.85, rate: 0.85, gender: 'male' },
  [StudioVibe.CELEBRATOR]: { pitch: 1.15, rate: 1.1, gender: 'female' },
  [StudioVibe.JOURNALIST]: { pitch: 1.0, rate: 0.95, gender: 'female' },
  [StudioVibe.JESTER]: { pitch: 1.1, rate: 1.05, gender: 'male' },
  [StudioVibe.ROAST_MASTER]: { pitch: 0.9, rate: 1.1, gender: 'male' }
};

export const DEFAULT_BACKGROUNDS: Record<StudioVibe, string> = {
  [StudioVibe.HISTORIAN]: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1920',
  [StudioVibe.CELEBRATOR]: 'https://images.unsplash.com/photo-1514525253361-bee8718a300c?auto=format&fit=crop&q=80&w=1920',
  [StudioVibe.JOURNALIST]: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1920',
  [StudioVibe.JESTER]: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&q=80&w=1920',
  [StudioVibe.ROAST_MASTER]: 'https://images.unsplash.com/photo-1485872299829-c673f5194813?auto=format&fit=crop&q=80&w=1920',
};

export const VOICE_MAPPING: Record<StudioVibe, string> = {
  [StudioVibe.HISTORIAN]: 'Kore',
  [StudioVibe.CELEBRATOR]: 'Puck',
  [StudioVibe.JOURNALIST]: 'Zephyr',
  [StudioVibe.JESTER]: 'Fenrir',
  [StudioVibe.ROAST_MASTER]: 'Charon',
};
