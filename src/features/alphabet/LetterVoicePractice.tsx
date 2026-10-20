import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Mic, Square, Play } from 'lucide-react-native';
import { voiceRecorderService } from '../../services/voiceRecorderService';
import { soundService } from '../../services/soundService';
import { useAppearance } from '../../theme/useAppearance';
import { useAppStore } from '../../store/useAppStore';

export const LetterVoicePractice = () => {
  const { colors: c, isNight } = useAppearance();
  const [recording, setRecording] = useState(false);
  const [ready, setReady] = useState(false);
  const active = useRef(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const paused = useRef(false);
  const { learningPaused } = useAppStore();

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') return;
      voiceRecorderService.stopPlayback();
      if (active.current) void voiceRecorderService.stopRecording().catch(() => {}).finally(() => {
        active.current = false;
        if (mounted.current) { setRecording(false); setReady(voiceRecorderService.hasRecording()); }
      });
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      voiceRecorderService.stopPlayback();
      if (active.current) void voiceRecorderService.stopRecording().catch(() => {});
    };
  }, []);
  useEffect(() => {
    paused.current = learningPaused;
    if (!learningPaused) return;
    voiceRecorderService.stopPlayback();
    if (active.current) void voiceRecorderService.stopRecording().catch(() => {}).finally(() => {
      active.current = false;
      if (mounted.current) { setRecording(false); setReady(voiceRecorderService.hasRecording()); }
    });
  }, [learningPaused]);

  const toggle = async () => {
    if (busy.current || paused.current) return;
    busy.current = true;
    try {
    void soundService.stopSpeaking();
    if (recording) {
      await voiceRecorderService.stopRecording();
      active.current = false;
      setRecording(false);
      const hasRec = voiceRecorderService.hasRecording();
      setReady(hasRec);
      if (hasRec && mounted.current && !paused.current && AppState.currentState === 'active') void voiceRecorderService.playLastRecording();
    } else {
      const started = await voiceRecorderService.startRecording();
      if (!mounted.current || paused.current || AppState.currentState !== 'active') {
        if (started) await voiceRecorderService.stopRecording();
        return;
      }
      active.current = started;
      setRecording(started);
    }
    } catch { if (mounted.current) setRecording(false); }
    finally { busy.current = false; }
  };

  return (
    <View style={s.row}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={recording ? 'وەستاندنی تۆمار' : 'دەنگی خۆم تۆمار بکەم'}
        disabled={learningPaused}
        onPress={() => void toggle()}
        style={[
          s.iconBtn,
          recording
            ? { backgroundColor: '#ef4444', borderBottomColor: '#b91c1c' }
            : { backgroundColor: isNight ? c.lavender : '#ede5ff', borderBottomColor: isNight ? c.edge : '#cab8f5' },
        ]}
      >
        {recording ? (
          <Square size={22} color="#ffffff" fill="#ffffff" />
        ) : (
          <Mic size={24} color={isNight ? c.ink : '#6d4ae8'} strokeWidth={2.2} />
        )}
      </TouchableOpacity>
      {ready && !recording && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="گوێ لە دەنگی خۆم بگرم"
          disabled={learningPaused}
          onPress={() => void voiceRecorderService.playLastRecording()}
          style={[
            s.iconBtn,
            { backgroundColor: isNight ? c.leaf : '#dcfce7', borderBottomColor: '#16a34a' },
          ]}
        >
          <Play size={22} color={isNight ? c.ink : '#15803d'} fill={isNight ? c.ink : '#15803d'} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

