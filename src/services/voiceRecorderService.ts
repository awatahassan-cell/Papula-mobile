import { AudioModule, AudioRecorder, AudioPlayer, RecordingPresets, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

class MobileVoiceRecorderService {
  private recording: AudioRecorder | null = null;
  private recordedUri: string | null = null;
  private playbackSound: AudioPlayer | null = null;
  private isRecordingState = false;
  public async startRecording(): Promise<boolean> {
    try {
      const permission=await AudioModule.requestRecordingPermissionsAsync();if(!permission.granted)return false;
      await setAudioModeAsync({allowsRecording:true,playsInSilentMode:true});
      this.playbackSound?.pause();this.playbackSound?.release();this.playbackSound=null;
      // eslint-disable-next-line import/namespace -- AudioRecorder is a native class exposed on AudioModule
      const recording=new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      this.recording=recording;await recording.prepareToRecordAsync();recording.record();this.isRecordingState=true;return true;
    } catch {this.recording?.release();this.recording=null;this.isRecordingState=false;return false;}
  }
  public async stopRecording(): Promise<string|null> {
    if(!this.recording)return null;
    try {await this.recording.stop();this.recordedUri=this.recording.uri;return this.recordedUri;}
    finally {this.recording.release();this.recording=null;this.isRecordingState=false;await setAudioModeAsync({allowsRecording:false,playsInSilentMode:true});}
  }
  public hasRecording(){return !!this.recordedUri;}
  public async playLastRecording():Promise<void>{
    if(!this.recordedUri)return;this.playbackSound?.pause();this.playbackSound?.release();this.playbackSound=createAudioPlayer({uri:this.recordedUri});this.playbackSound.play();
  }
  public isRecording(){return this.isRecordingState;}
}
export const voiceRecorderService=new MobileVoiceRecorderService();
