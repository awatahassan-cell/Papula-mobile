import { TactileButton as TouchableOpacity } from '../../components/TactileButton';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Mic, Square, Play } from 'lucide-react-native';
import { voiceRecorderService } from '../../services/voiceRecorderService';
import { soundService } from '../../services/soundService';
import { useAppearance } from '../../theme/useAppearance';

export const LetterVoicePractice = () => {
  const { colors: c, isNight } = useAppearance();
  const [recording, setRecording] = useState(false);
  const [ready, setReady] = useState(false);
  const active = useRef(false);

  useEffect(() => () => {
    if (active.current) void voiceRecorderService.stopRecording();
  }, []);

  const toggle = async () => {
    void soundService.stopSpeaking();
    if (recording) {
      await voiceRecorderService.stopRecording();
      active.current = false;
      setRecording(false);
      const hasRec = voiceRecorderService.hasRecording();
      setReady(hasRec);
      if (hasRec) void voiceRecorderService.playLastRecording();
    } else {
      const started = await voiceRecorderService.startRecording();
      active.current = started;
      setRecording(started);
    }
  };

  return (
    <View style={s.row}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={recording ? 'وەستاندنی تۆمار' : 'دەنگی خۆم تۆمار بکەم'}
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

