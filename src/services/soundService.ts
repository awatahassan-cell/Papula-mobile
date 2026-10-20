import { OFFLINE_AUDIO, OfflineTrack } from '../data/offlineAudio';
import { mockLetters } from '../data/mockLetters';
import { audioCache, audioCacheKey, bytesToBase64, base64ToBytes } from './audioCache';
import { Platform } from 'react-native';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { learningStoryChunks, LEARNING_STORY_RATE, LEARNING_SENTENCE_PAUSE_MS, NarrationChunk } from './storyPlayback';

// Applied at playback so bundled and cached ElevenLabs recordings slow down too.
export const CHILD_NARRATION_RATE = 0.85;

export interface SpeechOptions {
  narrationText?: string;
  playbackRate?: number;
  letterName?: string;
  voice?: string;
  voiceId?: string;
  onWord?: (start: number, end: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

class MobileSoundService {
  private audioCtx: any = null;
  private soundFxEnabled: boolean = true;
  private volume: number = 0.9;
  private isSpeaking: boolean = false;
  private learningPaused = false;
  public setLearningPaused(paused: boolean) {
    this.learningPaused = paused;
    if (paused) void this.stopSpeaking();
  }
  private activeSpeakingText: string | null = null;
  private listeners: Set<(speaking: boolean, activeText: string | null) => void> = new Set();
  private currentSound: AudioPlayer | null = null;
  private playbackFile: File | null = null;
  private speechGeneration = 0;
  private storyGeneration = 0;
  private storyPauseTimer: ReturnType<typeof setTimeout> | null = null;
  private segmentTimer: ReturnType<typeof setTimeout> | null = null;
  private cachedVoices: any[] = [];
  private timingCache = new Map<string, {start:number;end:number;from:number;to:number}[]>();

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

  // ================= REACTION CUES =================
  // Games call playCorrect / playEncouragingTryAgain / playSuccessFanfare at the exact moment an answer is judged.
  // The same moment drives the full-screen butterfly reaction, even when sound effects are switched off.
  private cueListeners = new Set<(cue: 'correct' | 'wrong' | 'fanfare') => void>();
  public onCue(listener: (cue: 'correct' | 'wrong' | 'fanfare') => void) {
    this.cueListeners.add(listener);
    return () => { this.cueListeners.delete(listener); };
  }
  private emitCue(cue: 'correct' | 'wrong' | 'fanfare') {
    this.cueListeners.forEach(listener => { try { listener(cue); } catch { /* a broken listener must never stop the game */ } });
  }
  public isFxEnabled() { return this.soundFxEnabled; }

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

  // Generation credentials belong to the build script, never the installed app.
  // Explicit opt-in remains available for development tools and their tests.
  private elevenLabsApiKey: string = '';
  private selectedVoice: string = 'Papula';
  private selectedVoiceId: string = 'tkI70vi7ETrk5NakcLUP';
  private currentAudioElement: any = null;
  private audioMemoryCache = new Map<string, string>();

  public setElevenLabsApiKey(key: string) {
    this.elevenLabsApiKey = key;
  }

  public setVoice(_voice: string, _voiceId?: string) {
    this.selectedVoice = 'Papula';
    this.selectedVoiceId = 'tkI70vi7ETrk5NakcLUP';
  }

  public getVoice(): string {
    return this.selectedVoice;
  }

  public getVoiceId(): string {
    return this.selectedVoiceId;
  }

  public async stopSpeaking(preserveStory = false) {
    if (this.segmentTimer !== null) clearTimeout(this.segmentTimer);
    this.segmentTimer = null;
    if (!preserveStory) {
      this.storyGeneration++;
      if (this.storyPauseTimer !== null) clearTimeout(this.storyPauseTimer);
      this.storyPauseTimer = null;
    }
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

  public getBundledAudioCount() { return Object.keys(OFFLINE_AUDIO).length; }
  public getLegacyCachedSoundKeys(): string[] { return []; }
  public getLegacyAudioCount() { return 0; }
  public async playLegacyCachedSound(_key: string) {
    // Old recordings are intentionally excluded from the fresh offline pack.
  }
  public async playReviewedSound(uri: string, options: SpeechOptions = {}) {
    if (this.learningPaused) { options.onError?.(); return; }
    const stopping=this.stopSpeaking();const generation=this.speechGeneration;await stopping;
    if(generation!==this.speechGeneration)return;
    this.isSpeaking=true;this.activeSpeakingText=null;this.notify();options.onStart?.();
    try {await this.playAudioUrl(uri,options.onEnd,options.onError,1);} catch {if(generation===this.speechGeneration){this.isSpeaking=false;this.notify();options.onError?.();}}
  }

  // Sentence-by-sentence learning: wait for actual completion, then give the
  // child time to understand before starting the next sentence.
  public async speakStory(storyId: string, pageNumber: number, text: string, options: SpeechOptions = {}) {
    return this.speakSequence(learningStoryChunks(storyId, pageNumber, text), options, LEARNING_SENTENCE_PAUSE_MS, LEARNING_STORY_RATE);
  }

  /** True when a recording for exactly this text ships in the app (syllables and handwriting tips are optional). */
  public canSpeak(text: string): boolean {
    return OFFLINE_AUDIO[audioCacheKey(text, this.selectedVoiceId)] !== undefined;
  }

  /** Reads recorded sentences one after another. Resolves false (and plays nothing) unless every one is recorded. */
  public async speakPhrases(texts: string[], options: SpeechOptions = {}): Promise<boolean> {
    if (!texts.length || !texts.every(text => this.canSpeak(text))) return false;
    await this.speakSequence(texts.map(text => ({ text, narrationText: text })), options, 350, CHILD_NARRATION_RATE);
    return true;
  }

  public async speakLetter(name: string, options: SpeechOptions = {}) {
    return this.speakSequence([
      { text: 'پیتی', narrationText: 'پیتی.' },
      { text: name, narrationText: name },
    ], options, 300, CHILD_NARRATION_RATE);
  }

  private async speakSequence(chunks: NarrationChunk[], options: SpeechOptions, pauseMs: number, rate: number) {
    if (this.learningPaused) { options.onError?.(); return; }
    const stopping = this.stopSpeaking();
    const token = this.storyGeneration;
    await stopping;
    if (token !== this.storyGeneration) return;
    if (!chunks.length) { options.onEnd?.(); return; }
    const play = (index: number): Promise<void> => {
      let settled = false;
      return this.speakChunk(chunks[index].text, {
      ...options,
      narrationText: chunks[index].narrationText,
      onWord: options.onWord ? (start, end) => options.onWord!((chunks[index].startOffset || 0) + start, (chunks[index].startOffset || 0) + end) : undefined,
      playbackRate: rate,
      onStart: index === 0 ? options.onStart : undefined,
      onEnd: () => {
        if (settled || token !== this.storyGeneration) return;
        settled = true;
        if (index === chunks.length - 1) { options.onEnd?.(); return; }
        this.isSpeaking = true;
        this.activeSpeakingText = null;
        this.notify();
        this.storyPauseTimer = setTimeout(() => {
          this.storyPauseTimer = null;
          if (token === this.storyGeneration) void play(index + 1);
        }, pauseMs);
      },
      onError: () => {
        if (settled || token !== this.storyGeneration) return;
        settled = true;
        void this.stopSpeaking();
        options.onError?.();
      },
      }, true);
    };
    await play(0);
  }

  // Speak Kurdish words or letters via ElevenLabs v4.
  public async speakWord(text: string, options?: SpeechOptions | (() => void)) {
    const opts = typeof options === 'function' ? { onEnd: options } : options || {};
    const mastery = mockLetters.find(item => text === `ئافەرم! تەواو فێری نووسینی پیتی ${item.name} بوویت.`);
    if (mastery) return this.speakSequence([
      { text: 'ئافەرم! تەواو فێری نووسینی پیتی', narrationText: 'ئافەرم! تەواو فێری نووسینی پیتی' },
      { text: mastery.name, narrationText: mastery.name }, { text: 'بوویت.', narrationText: 'بوویت.' },
    ], opts, 100, CHILD_NARRATION_RATE);
    const lesson = mockLetters.find(item => item.exampleWords.some(word => text === `وشەی ${word.word}. پیتی ${item.name} بدۆزەوە.`));
    if (lesson) {
      const word = lesson.exampleWords.find(word => text === `وشەی ${word.word}. پیتی ${lesson.name} بدۆزەوە.`)!;
      return this.speakSequence(['وشەی', word.word, 'پیتی', lesson.name, 'بدۆزەوە.'].map(part => ({ text: part, narrationText: part === 'پیتی' ? 'پیتی.' : part })), opts, 100, CHILD_NARRATION_RATE);
    }
    const letter = mockLetters.find(item => text.trim() === item.glyph || text.trim() === `پیتی ${item.name}`);
    if (opts.letterName || letter) return this.speakLetter(opts.letterName || letter!.name, opts);
    return this.speakChunk(text, options);
  }

  private async speakChunk(text: string, options?: SpeechOptions | (() => void), preserveStory = false) {
    if (this.learningPaused) { if (typeof options !== 'function') options?.onError?.(); return; }
    let opts: SpeechOptions = {};
    if (typeof options === 'function') {
      opts = { onEnd: options };
    } else if (options) {
      opts = options;
    }

    const stopping = this.stopSpeaking(preserveStory);
    const generation = this.speechGeneration;
    await stopping;
    if (generation !== this.speechGeneration) return;
    this.isSpeaking = true;
    this.activeSpeakingText = text;
    this.notify();
    if (opts.onStart) opts.onStart();

    const speakText = text;

    const voiceId = this.selectedVoiceId;
    const playbackRate = opts.playbackRate ?? CHILD_NARRATION_RATE;
    // Tagged narration has its own cache entry. Device speech fallbacks keep
    // the clean reading text because they do not interpret ElevenLabs tags.
    const narrationText = opts.narrationText?.trim() || speakText;
    const literalLetter = mockLetters.some(letter => letter.name === text);
    const cacheKey = audioCacheKey(narrationText + (literalLetter ? '[literal-letter-v1]' : ''), voiceId);
    const timedKey = cacheKey + (opts.onWord ? ":timed-v1" : "");
    const timings = this.timingCache.get(timedKey);
    const progress = (seconds:number) => {
      const word = timings?.find(item => seconds >= item.from && seconds < item.to);
      if (word && generation === this.speechGeneration) opts.onWord?.(word.start,word.end);
    };
    const bundled = OFFLINE_AUDIO[cacheKey];
    if (bundled !== undefined) {
      try { await this.playOfflineTrack(bundled, opts, playbackRate); }
      catch { if (generation === this.speechGeneration) { this.isSpeaking = false; this.activeSpeakingText = null; this.notify(); opts.onError?.(); } }
      return;
    }
    // A missing asset is an explicit error; never silently switch to an online
    // device voice or a stale cache in the installed app.
    if (!this.elevenLabsApiKey) {
      this.isSpeaking = false; this.activeSpeakingText = null; this.notify(); opts.onError?.(); return;
    }
    const cached = this.audioMemoryCache.get(timedKey) || (!opts.onWord ? await audioCache.get(cacheKey) : null);
    if (generation !== this.speechGeneration) return;
    if (cached) {
      try { await this.playAudioUrl(cached, opts.onEnd, opts.onError, playbackRate, progress); return; } catch {}
    }

    // 1. ElevenLabs v4 API with audio playback
    if (this.elevenLabsApiKey) {
      try {
        const endpoint = opts.onWord ? `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps` : literalLetter ? `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}` : 'https://api.elevenlabs.io/v1/text-to-dialogue';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey,
          },
          body: JSON.stringify(opts.onWord ? {text:narrationText, model_id:'eleven_v4',apply_text_normalization:'off'} : literalLetter ? {text:narrationText,model_id:'eleven_v4',apply_text_normalization:'off'} : {
            inputs: [{ text: narrationText, voice_id: voiceId }],
            model_id: 'eleven_v4',
          }),
        });

        if (generation !== this.speechGeneration) return;
        if (res.ok) {
          if (opts.onWord) {
            const result = await res.json();
            if (generation !== this.speechGeneration) return;
            const alignment = result.normalized_alignment || result.alignment;
            const spoken = alignment?.characters?.join('') || '';
            const words: {start:number;end:number;from:number;to:number}[] = [];
            let cursor = 0;
            for (const match of speakText.matchAll(/\S+/g)) {
              const word = match[0];
              const at = spoken.indexOf(word, cursor);
              if (at < 0) continue;
              const from = alignment.character_start_times_seconds[at];
              const to = alignment.character_end_times_seconds[at + word.length - 1];
              if (Number.isFinite(from) && Number.isFinite(to)) words.push({start:match.index!,end:match.index!+word.length,from,to});
              cursor = at + word.length;
            }
            if (!result.audio_base64) throw new Error('Empty timed audio');
            const uri = 'data:audio/mpeg;base64,' + result.audio_base64;
            this.timingCache.set(timedKey,words);
            this.audioMemoryCache.set(timedKey,uri);
            while(this.timingCache.size>64) {const oldest=this.timingCache.keys().next().value!;this.timingCache.delete(oldest);this.audioMemoryCache.delete(oldest);}
            await this.playAudioUrl(uri,opts.onEnd,opts.onError,playbackRate,seconds=>{
              const word=words.find(item=>seconds>=item.from&&seconds<item.to);
              if(word&&generation===this.speechGeneration)opts.onWord?.(word.start,word.end);
            });
            return;
          }
          const arrayBuf = await res.arrayBuffer();
          if (generation !== this.speechGeneration) return;
          const bytes = new Uint8Array(arrayBuf);
          if (!bytes.length) throw new Error('Empty audio response');
          const uri = 'data:audio/mpeg;base64,' + bytesToBase64(bytes);
          await audioCache.put(cacheKey, uri);
          if (generation !== this.speechGeneration) return;
          this.audioMemoryCache.set(cacheKey, uri);
          while (this.audioMemoryCache.size > 64) this.audioMemoryCache.delete(this.audioMemoryCache.keys().next().value!);
          await this.playAudioUrl(uri, opts.onEnd, opts.onError, playbackRate);
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

        utterance.rate = opts.playbackRate ?? 0.75;
        utterance.pitch = 1.12;
        utterance.volume = this.volume;

        utterance.onboundary = event => { if(generation === this.speechGeneration) opts.onWord?.(event.charIndex,event.charIndex+(event.charLength || speakText.slice(event.charIndex).search(/\s|$/))); };
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
        rate: opts.playbackRate ?? 0.75,
        onBoundary: (event: {charIndex:number;charLength:number}) => { if(generation === this.speechGeneration) opts.onWord?.(event.charIndex,event.charIndex+event.charLength); },
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

  private async playOfflineTrack(track: OfflineTrack, options: SpeechOptions, rate: number) {
    const generation = this.speechGeneration;
    let settled = false;
    const clearBoundary = () => {
      if (this.segmentTimer !== null) clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    };
    const finish = (error = false) => {
      if (settled || generation !== this.speechGeneration) return;
      settled = true; clearBoundary();
      this.currentAudioElement?.pause();
      this.currentSound?.pause();
      this.isSpeaking = false; this.activeSpeakingText = null; this.notify();
      if (error) options.onError?.(); else options.onEnd?.();
    };
    const progress = (seconds: number) => {
      const word = track.timings.find(item => seconds >= item.from && seconds < item.to);
      if (word) options.onWord?.(word.start, word.end);
    };
    // Each segment ends at its measured audio boundary. Recheck media time
    // after the timer so buffering never falsely completes a lesson.
    const scheduleBoundary = (position: () => number) => {
      if (settled || generation !== this.speechGeneration) return;
      clearBoundary();
      const check = () => {
        if (settled || generation !== this.speechGeneration) return;
        const remaining = track.end - position();
        if (remaining <= 0.015) finish();
        else this.segmentTimer = setTimeout(check, Math.max(16, remaining / rate * 1000));
      };
      check();
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const audio = new (window as any).Audio(String(track.source));
      this.currentAudioElement = audio;
      audio.volume = this.volume; audio.preservesPitch = true; audio.playbackRate = rate;
      audio.currentTime = track.start;
      audio.onloadedmetadata = () => { if (generation === this.speechGeneration) audio.currentTime = track.start; };
      audio.onplaying = () => scheduleBoundary(() => audio.currentTime);
      audio.onwaiting = () => { if (!settled && generation === this.speechGeneration) clearBoundary(); };
      audio.ontimeupdate = () => {
        if (generation !== this.speechGeneration || settled) return;
        progress(audio.currentTime);
        if (audio.currentTime >= track.end) finish();
      };
      audio.onended = () => finish(); audio.onerror = () => finish(true);
      try { await audio.play(); } catch { finish(true); }
      return;
    }
    const source = typeof track.source === 'number' ? track.source : { uri: track.source };
    const player = createAudioPlayer(source, { updateInterval: 40 });
    this.currentSound = player;
    player.volume = this.volume; player.shouldCorrectPitch = true; player.setPlaybackRate(rate, 'high');
    let starting = false, started = false;
    const start = async () => {
      if (starting || started || settled || generation !== this.speechGeneration) return;
      starting = true;
      try {
        await player.seekTo(track.start, 0, 0);
        if (generation !== this.speechGeneration || settled) return;
        started = true; player.play();
      } catch { finish(true); }
    };
    player.addListener('playbackStatusUpdate', status => {
      if (generation !== this.speechGeneration || settled) return;
      if (status.error) { finish(true); return; }
      if (status.isLoaded && !started) { void start(); return; }
      if (!started) return;
      progress(status.currentTime);
      if (status.didJustFinish || status.currentTime >= track.end) finish();
      else if (status.playing && !status.isBuffering) scheduleBoundary(() => player.currentTime);
      else clearBoundary();
    });
    if (player.isLoaded) await start();
  }

  private async playAudioUrl(url: string | number, onEnd?: () => void, onError?: () => void, rate = CHILD_NARRATION_RATE, onProgress?: (seconds:number) => void) {
    const generation = this.speechGeneration;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioClass = (window as any).Audio;
      const audio = new AudioClass(typeof url==='string'?url:String(url));
      audio.volume = this.volume;
      audio.preservesPitch = true;
      audio.playbackRate = rate;
      this.currentAudioElement = audio;

      audio.ontimeupdate = () => { if(generation === this.speechGeneration) onProgress?.(audio.currentTime); };
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
      const sound=createAudioPlayer(source, {updateInterval:80});
      this.currentSound=sound;sound.volume=this.volume;
      sound.shouldCorrectPitch = true;
      sound.setPlaybackRate(rate, 'high');
      let finished=false;
      sound.addListener('playbackStatusUpdate',status=>{
        if(generation!==this.speechGeneration||finished)return;
        onProgress?.(status.currentTime);
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

  public playCorrect(reaction = true) {
    if (reaction) this.emitCue('correct');
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
    this.emitCue('fanfare');
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
    this.emitCue('wrong');
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
