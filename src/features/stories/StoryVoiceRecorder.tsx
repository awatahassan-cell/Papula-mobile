import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { Mic, Play, Square } from 'lucide-react-native';
import { Text } from '../../components/RTLText';
import { TactileButton } from '../../components/TactileButton';
import { useAppearance } from '../../theme/useAppearance';

/** One local family reading per child and story. Native hooks own audio resources. */
export function StoryVoiceRecorder({ storyId, profileId, onBegin, onRecordingChange, narrationPlaying, paused = false }: {
  storyId: string; profileId: string; onBegin: () => void; onRecordingChange: (recording: boolean) => void; narrationPlaying: boolean; paused?: boolean;
}) {
  const { colors: c } = useAppearance();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(null);
  const playback = useAudioPlayerStatus(player);
  const [recording, setRecording] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false), active = useRef(true), recordingRef = useRef(false);
  const saveOnLeave = useRef<(() => Promise<void>) | null>(null);
  const pauseRef = useRef(paused);
  useEffect(() => { pauseRef.current = paused; }, [paused]);
  const key = `papoole_story_voice_${encodeURIComponent(profileId)}_${encodeURIComponent(storyId)}`;
  const callbacks = useRef({ onBegin, onRecordingChange });
  useEffect(() => { callbacks.current = { onBegin, onRecordingChange }; }, [onBegin, onRecordingChange]);
  useEffect(() => { if (narrationPlaying) player.pause(); }, [narrationPlaying, player]);

  useEffect(() => {
    active.current = true;
    if (Platform.OS !== 'web') void AsyncStorage.getItem(key).then(saved => {
      if (active.current && saved && new File(saved).exists) setUri(saved);
    }).catch(() => {});
    return () => {
      active.current = false;
      callbacks.current.onRecordingChange(false);
      if (recordingRef.current && !locked.current) void saveOnLeave.current?.().catch(() => {}).finally(() => setAudioModeAsync({ allowsRecording: false }).catch(() => {}));
    };
  }, [key, recorder]);

  const stop = async () => {
    await recorder.stop();
    recordingRef.current = false;
    if (active.current) setRecording(false);
    callbacks.current.onRecordingChange(false);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    let saved = recorder.uri;
    if (!saved) throw new Error('No recording');
    if (Platform.OS !== 'web') {
      const destination = new File(Paths.document, `${key}_${Date.now()}.m4a`);
      new File(saved).copy(destination);
      saved = destination.uri;
      const previous = await AsyncStorage.getItem(key);
      await AsyncStorage.setItem(key, saved);
      const ownedPrefix = new File(Paths.document, `${key}_`).uri;
      if (previous && previous !== saved && previous.startsWith(ownedPrefix)) { try { const old = new File(previous); if (old.exists) old.delete(); } catch {} }
    }
    if (active.current) setUri(saved);
  };
  useEffect(() => { saveOnLeave.current = stop; });

  const toggle = async () => {
    if (locked.current || (pauseRef.current && !recordingRef.current)) return;
    locked.current = true; setBusy(true); setError('');
    try {
      if (recordingRef.current) await stop();
      else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!active.current) return;
        if (!permission.granted) { setError('بۆ تۆمارکردنی خوێندنەوە، ڕێگە بە مایکرۆفۆن بدە.'); return; }
        player.pause(); callbacks.current.onBegin();
        callbacks.current.onRecordingChange(true);
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (!active.current || pauseRef.current || (AppState.currentState && AppState.currentState !== 'active')) { await setAudioModeAsync({ allowsRecording: false }); return; }
        recorder.record(); recordingRef.current = true;
        setRecording(true); callbacks.current.onRecordingChange(true);
      }
    } catch { if (active.current) setError('تۆمارکردن سەرکەوتوو نەبوو. جارێکی تر هەوڵ بدە.'); }
    finally {
      locked.current = false;
      if (!recordingRef.current) {
        callbacks.current.onRecordingChange(false);
        await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      }
      if (active.current) setBusy(false);
    }
  };

  // Save when the phone backgrounds; never leave the microphone running unseen.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') player.pause();
      if (state !== 'active' && recordingRef.current && !locked.current) void toggle();
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!paused) return;
    player.pause();
    if (recordingRef.current && !locked.current) void toggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const play = async () => {
    if (!uri || locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      if (playback.playing) { player.pause(); return; }
      callbacks.current.onBegin();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!active.current) return;
      player.replace({ uri }); player.play();
    } catch { setError('دەنگەکە نەکرایەوە. دەتوانیت دووبارە تۆماری بکەیت.'); }
    finally { locked.current = false; if (active.current) setBusy(false); }
  };

  return <View style={[s.panel, { backgroundColor: c.lavender, borderColor: c.edge }]}>
    <Text style={[s.title, { color: c.ink }]}>خوێندنەوەی خۆمان</Text>
    <Text style={{ color: c.muted }}>خۆت یان لەگەڵ دایک و باوک چیرۆکەکە بخوێننەوە، پاشان گوێی لێ بگرنەوە.</Text>
    <View style={s.row}>
      <TactileButton accessibilityRole="button" accessibilityLabel={recording ? 'وەستاندن و هەڵگرتنی خوێندنەوە' : 'تۆمارکردنی خوێندنەوە'} disabled={busy} onPress={() => void toggle()} style={[s.button, { backgroundColor: recording ? '#b91c1c' : c.mintDark }]}>
        {recording ? <Square size={20} color="#ffffff" /> : <Mic size={20} color="#ffffff" />}<Text style={s.buttonText}>{recording ? 'وەستاندن و هەڵگرتن' : uri ? 'دووبارە تۆمار بکەم' : 'دەنگمان تۆمار بکەین'}</Text>
      </TactileButton>
      {uri && !recording && <TactileButton accessibilityRole="button" accessibilityLabel="گوێگرتن لە خوێندنەوەی خۆمان" disabled={busy} onPress={() => void play()} style={[s.button, { backgroundColor: c.paper }]}><Play size={20} color={c.ink} /><Text style={{ color: c.ink }}>{playback.playing ? 'بوەستێنە' : 'گوێ بگرەوە'}</Text></TactileButton>}
    </View>
    {recording && <Text accessibilityLiveRegion="polite" style={{ color: c.ink }}>● دەنگ تۆمار دەکرێت…</Text>}
    {!!error && <Text accessibilityRole="alert" style={{ color: c.ink }}>{error}</Text>}
  </View>;
}
const s = StyleSheet.create({
  panel: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 14, borderWidth: 1, borderRadius: 20, gap: 8, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 48, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexGrow: 1, flexShrink: 1 },
  buttonText: { color: '#ffffff', flexShrink: 1 },
});
