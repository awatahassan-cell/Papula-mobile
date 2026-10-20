import { AudioModule, AudioRecorder, AudioPlayer, RecordingPresets, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

class MobileVoiceRecorderService {
  private recording: AudioRecorder | null = null;
  private recordedUri: string | null = null;
  private playbackSound: AudioPlayer | null = null;
  private isRecordingState = false;
  private transitioning = false;
  public async startRecording(): Promise<boolean> {
    if (this.transitioning || this.recording) return false;
    this.transitioning = true;
    try {
      const permission=await AudioModule.requestRecordingPermissionsAsync();if(!permission.granted)return false;
      await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true});
      this.playbackSound?.pause();this.playbackSound?.release();this.playbackSound=null;
      // eslint-disable-next-line import/namespace -- AudioRecorder is a native class exposed on AudioModule
      const recording=new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      this.recording=recording;await recording.prepareToRecordAsync();recording.record();this.isRecordingState=true;return true;
    } catch {this.recording?.release();this.recording=null;this.isRecordingState=false;await setAudioModeAsync({allowsRecording:false,playsInSilentMode:true}).catch(() => {});return false;}
    finally {this.transitioning=false;}
  }
  public async stopRecording(): Promise<string|null> {
    if(this.transitioning || !this.recording)return null;
    this.transitioning=true;
    try {await this.recording.stop();this.recordedUri=this.recording.uri;return this.recordedUri;}
    finally {this.recording.release();this.recording=null;this.isRecordingState=false;this.transitioning=false;await setAudioModeAsync({allowsRecording:false,playsInSilentMode:true});}
  }
  public hasRecording(){return !!this.recordedUri;}
  public stopPlayback(){this.playbackSound?.pause();this.playbackSound?.release();this.playbackSound=null;}
  public async playLastRecording():Promise<void>{
    if(!this.recordedUri)return;this.playbackSound?.pause();this.playbackSound?.release();this.playbackSound=createAudioPlayer({uri:this.recordedUri});this.playbackSound.play();
  }
  public isRecording(){return this.isRecordingState;}
}
export const voiceRecorderService=new MobileVoiceRecorderService();
