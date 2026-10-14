import { BUNDLED_AUDIO, LEGACY_AUDIO } from '../data/bundledAudio';
import { audioCache, audioCacheKey, bytesToBase64, base64ToBytes } from './audioCache';
import { Platform } from 'react-native';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';

export interface SpeechOptions {
  letterName?: string;
  voice?: string;
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

class MobileSoundService {
  private audioCtx: any = null;
  private soundFxEnabled: boolean = true;
  private volume: number = 0.9;
  private isSpeaking: boolean = false;
  private activeSpeakingText: string | null = null;
  private listeners: Set<(speaking: boolean, activeText: string | null) => void> = new Set();
  private currentSound: AudioPlayer | null = null;
  private playbackFile: File | null = null;
  private speechGeneration = 0;
  private cachedVoices: any[] = [];

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        this.loadWebVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadWebVoices();
        }
      }
    }
  }

  private loadWebVoices() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        this.cachedVoices = v;
      }
    }
  }

  private getAudioContext(): any {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public subscribe(callback: (speaking: boolean, activeText: string | null) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isSpeaking, this.activeSpeakingText));
  }

  public setSoundFxEnabled(enabled: boolean) {
    this.soundFxEnabled = enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  private elevenLabsApiKey: string = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
  private selectedVoice: string = 'Bella';
  private selectedVoiceId: string = 'hpp4J3VqNfWAUOO0d1Us';
  private currentAudioElement: any = null;
  private audioMemoryCache = new Map<string, string>();

  public setElevenLabsApiKey(key: string) {
    this.elevenLabsApiKey = key;
  }

  public setVoice(voice: string, voiceId?: string) {
    this.selectedVoice = voice;
    if (voiceId) {
      this.selectedVoiceId = voiceId;
    }
  }

  public getVoice(): string {
    return this.selectedVoice;
  }

  public getVoiceId(): string {
    return this.selectedVoiceId;
  }

  public async stopSpeaking() {
    this.speechGeneration++;
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    } else {
      Speech.stop();
    }

    if (this.currentSound) {
      try {
        this.currentSound.pause();
        this.currentSound.release();
      } catch {}
      this.currentSound = null;
    }

    if(this.playbackFile){try{this.playbackFile.delete();}catch{}this.playbackFile=null;}
    this.isSpeaking = false;
    this.activeSpeakingText = null;
    this.notify();
  }

  public getBundledAudioCount() { return Object.keys(BUNDLED_AUDIO).length; }
  public getLegacyCachedSoundKeys() { return Object.keys(LEGACY_AUDIO); }
  public getLegacyAudioCount() { return Object.keys(LEGACY_AUDIO).length; }
  public async playLegacyCachedSound(key: string) {
    const source=LEGACY_AUDIO[key];if(source===undefined)return;
    const stopping=this.stopSpeaking();const generation=this.speechGeneration;await stopping;
    if(generation!==this.speechGeneration)return;
    this.isSpeaking=true;this.activeSpeakingText=null;this.notify();await this.playAudioUrl(source);
  }
  public async playReviewedSound(uri: string, options: SpeechOptions = {}) {
    const stopping=this.stopSpeaking();const generation=this.speechGeneration;await stopping;
    if(generation!==this.speechGeneration)return;
    this.isSpeaking=true;this.activeSpeakingText=null;this.notify();options.onStart?.();
    try {await this.playAudioUrl(uri,options.onEnd,options.onError);} catch {if(generation===this.speechGeneration){this.isSpeaking=false;this.notify();options.onError?.();}}
  }

  // Speak Kurdish words or letters via ElevenLabs v4
  public async speakWord(text: string, options?: SpeechOptions | (() => void)) {
    let opts: SpeechOptions = {};
    if (typeof options === 'function') {
      opts = { onEnd: options };
    } else if (options) {
      opts = options;
    }

    const stopping = this.stopSpeaking();
    const generation = this.speechGeneration;
    await stopping;
    if (generation !== this.speechGeneration) return;
    this.isSpeaking = true;
    this.activeSpeakingText = text;
    this.notify();
    if (opts.onStart) opts.onStart();

    let speakText = text;
    if (opts.letterName && text.length <= 4) {
      speakText = `پیتی ${opts.letterName}`;
    } else if (text.length === 1 && !text.startsWith('پیتی')) {
      speakText = `پیتی ${text}`;
    }

    const voiceId = opts.voiceId || this.selectedVoiceId;
    const cacheKey = audioCacheKey(speakText, voiceId);
    const bundled = BUNDLED_AUDIO[cacheKey];
    if (bundled !== undefined) {
      try { await this.playAudioUrl(bundled, opts.onEnd, opts.onError); return; } catch {}
    }
    const cached = this.audioMemoryCache.get(cacheKey) || await audioCache.get(cacheKey);
    if (generation !== this.speechGeneration) return;
    if (cached) {
      try { await this.playAudioUrl(cached, opts.onEnd, opts.onError); return; } catch {}
    }

    // 1. ElevenLabs v4 API with audio playback
    if (this.elevenLabsApiKey) {
      try {
        const endpoint = 'https://api.elevenlabs.io/v1/text-to-dialogue';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey,
          },
          body: JSON.stringify({
            inputs: [{ text: speakText, voice_id: voiceId }],
            model_id: 'eleven_v4',
          }),
        });

        if (generation !== this.speechGeneration) return;
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          if (generation !== this.speechGeneration) return;
          const bytes = new Uint8Array(arrayBuf);
          if (!bytes.length) throw new Error('Empty audio response');
          const uri = 'data:audio/mpeg;base64,' + bytesToBase64(bytes);
          await audioCache.put(cacheKey, uri);
          if (generation !== this.speechGeneration) return;
          this.audioMemoryCache.set(cacheKey, uri);
          while (this.audioMemoryCache.size > 64) this.audioMemoryCache.delete(this.audioMemoryCache.keys().next().value!);
          await this.playAudioUrl(uri, opts.onEnd, opts.onError);
          return;
        }
      } catch (err) {
        console.warn('ElevenLabs API error, falling back:', err);
      }
    }

    if (generation !== this.speechGeneration) return;
    // 2. Web fallback
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speakText);

        if (this.cachedVoices.length === 0) {
          this.loadWebVoices();
        }
        const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();

        const preferredVoice =
          voices.find((v: any) => v.lang.startsWith('ku')) ||
          voices.find((v: any) => v.lang.startsWith('fa') && (v.name.includes('Natural') || v.name.includes('Google'))) ||
          voices.find((v: any) => v.lang.startsWith('ar') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Maged') || v.name.includes('Laila') || v.name.includes('Tarik') || v.name.includes('Salma'))) ||
          voices.find((v: any) => v.lang.startsWith('fa')) ||
          voices.find((v: any) => v.lang.startsWith('ar')) ||
          voices.find((v: any) => v.default);

        if (preferredVoice) {
          utterance.voice = preferredVoice;
          utterance.lang = preferredVoice.lang;
        } else {
          utterance.lang = 'ar-IQ';
        }

        utterance.rate = 0.8;
        utterance.pitch = 1.12;
        utterance.volume = this.volume;

        utterance.onend = () => {
          if (generation !== this.speechGeneration) return;
          this.isSpeaking = false;
          this.activeSpeakingText = null;
          this.notify();
          if (opts.onEnd) opts.onEnd();
        };

        utterance.onerror = () => {
          if (generation !== this.speechGeneration) return;
          this.isSpeaking = false;
          this.activeSpeakingText = null;
          this.notify();
          if (opts.onError) opts.onError();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('Web speech synthesis fallback:', err);
      }
    }

    // 3. Native Mobile fallback
    try {
      Speech.speak(speakText, {
        language: 'ar-IQ',
        pitch: 1.12,
        rate: 0.8,
        onDone: () => {
          if (generation !== this.speechGeneration) return;
          this.isSpeaking = false;
          this.activeSpeakingText = null;
          this.notify();
          if (opts.onEnd) opts.onEnd();
        },
        onError: () => {
          if (generation !== this.speechGeneration) return;
          this.isSpeaking = false;
          this.activeSpeakingText = null;
          this.notify();
          if (opts.onError) opts.onError();
        },
      });
    } catch {
      setTimeout(() => {
        if (generation !== this.speechGeneration) return;
        this.isSpeaking = false;
        this.activeSpeakingText = null;
        this.notify();
        if (opts.onError) opts.onError();
      }, 1200);
    }
  }

  private async playAudioUrl(url: string | number, onEnd?: () => void, onError?: () => void) {
    const generation = this.speechGeneration;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioClass = (window as any).Audio;
      const audio = new AudioClass(typeof url==='string'?url:String(url));
      audio.volume = this.volume;
      this.currentAudioElement = audio;

      audio.onended = () => {
        if (generation !== this.speechGeneration) return;
        this.isSpeaking = false;
        this.activeSpeakingText = null;
        this.notify();
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        if (generation !== this.speechGeneration) return;
        this.isSpeaking = false;
        this.activeSpeakingText = null;
        this.notify();
        if (onError) onError();
      };

      await audio.play();
    } else {
      let source: number | {uri:string}=typeof url==='number'?url:{uri:url};
      if(typeof url==='string' && url.startsWith('data:audio/')) {
        const file=new File(Paths.cache,'papoole-voice-'+generation+'.mp3');file.create({overwrite:true});file.write(base64ToBytes(url.slice(url.indexOf(',')+1)));this.playbackFile=file;source={uri:file.uri};
      }
      if(generation!==this.speechGeneration)return;
      const sound=createAudioPlayer(source);
      this.currentSound=sound;sound.volume=this.volume;
      let finished=false;
      sound.addListener('playbackStatusUpdate',status=>{
        if(generation!==this.speechGeneration||finished)return;
        if(status.error){finished=true;this.isSpeaking=false;this.activeSpeakingText=null;this.notify();onError?.();}
        else if(status.didJustFinish){finished=true;this.isSpeaking=false;this.activeSpeakingText=null;this.notify();onEnd?.();}
      });
      sound.play();
    }
  }

  // ================= SOUND EFFECTS =================
  public playPop() {
    if (!this.soundFxEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  public playCorrect() {
    if (!this.soundFxEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0.2 * this.volume, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.2);
      });
    } catch {}
  }

  public playSuccessFanfare() {
    if (!this.soundFxEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.28 * this.volume, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
      });
    } catch {}
  }

  public playGrandCelebration() {
    if (!this.soundFxEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

        gain.gain.setValueAtTime(0.3 * this.volume, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.65);
      });
    } catch {}
  }

  public playStarChimeAscending(step: number = 0) {
    if (!this.soundFxEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5];
      const freq = baseFreqs[step % baseFreqs.length] * (1 + Math.floor(step / baseFreqs.length) * 0.2);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.24 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }

  public playEncouragingTryAgain() {
    if (!this.soundFxEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(360, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  public playLetterChime(letterIndex: number = 0) {
    if (!this.soundFxEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
      const freq = scale[letterIndex % scale.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.18 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }
}

export const soundService = new MobileSoundService();
