
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlob } from './audioService';

export interface GeminiSessionCallbacks {
  onOpen?: () => void;
  onTranscript?: (text: string, isUser: boolean) => void;
  onAudioStart?: () => void;
  onClose?: () => void;
  onError?: (err: any) => void;
}

export class GeminiSession {
  private ai: any;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private hostAudioDestination: MediaStreamAudioDestinationNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private active = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  getHostAudioStream(): MediaStream | null {
    return this.hostAudioDestination?.stream || null;
  }

  async connect(systemInstruction: string, voiceName: string, stream: MediaStream, callbacks: GeminiSessionCallbacks) {
    if (this.active) return;
    this.active = true;

    try {
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.hostAudioDestination = this.outputAudioContext.createMediaStreamDestination();

      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            callbacks.onOpen?.();
            const source = this.inputAudioContext!.createMediaStreamSource(stream);
            const scriptProcessor = this.inputAudioContext!.createScriptProcessor(2048, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!this.active) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              this.sessionPromise?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(this.inputAudioContext!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              callbacks.onTranscript?.(message.serverContent.outputTranscription.text, false);
            } else if (message.serverContent?.inputTranscription) {
              callbacks.onTranscript?.(message.serverContent.inputTranscription.text, true);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext!.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext!, 24000, 1);
              const source = this.outputAudioContext!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputAudioContext!.destination);
              if (this.hostAudioDestination) source.connect(this.hostAudioDestination);

              source.addEventListener('ended', () => this.sources.delete(source));
              source.start(this.nextStartTime);
              this.nextStartTime += audioBuffer.duration;
              this.sources.add(source);
              callbacks.onAudioStart?.();
            }

            if (message.serverContent?.interrupted) {
              this.sources.forEach(s => { try { s.stop(); } catch(e) {} });
              this.sources.clear();
              this.nextStartTime = 0;
            }
          },
          onerror: (e: any) => {
            this.active = false;
            callbacks.onError?.(e);
          },
          onclose: () => {
            this.active = false;
            callbacks.onClose?.();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });
    } catch (err) {
      this.active = false;
      callbacks.onError?.(err);
      throw err;
    }
  }

  async sendImageFrame(base64Data: string) {
    if (!this.active) return;
    this.sessionPromise?.then(session => {
      session.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'image/jpeg' }
      });
    }).catch(() => {});
  }

  stop() {
    this.active = false;
    this.sessionPromise?.then(s => s.close());
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
  }
}
