import { useThemeStyles } from '../theme/useAppearance';
import { TactileButton as TouchableOpacity } from './TactileButton';
import { rtlProps, rtlLayout } from '../theme/rtl';
import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { Text, TextInput } from './RTLText';
import { Check, X } from 'lucide-react-native';
import { PapulaMascot } from './PapulaMascot';
import {
  generateParentGateChallenge,
  verifyParentGateAnswer,
  MathChallenge,
} from '../services/parentGate';
import { soundService } from '../services/soundService';
import { useAppStore } from '../store/useAppStore';

export const ParentGateModal: React.FC = () => {
  const {parentGateOpen}=useAppStore();
  return parentGateOpen ? <ParentGateContent /> : null;
};

const ParentGateContent: React.FC = () => {
  const styles = useThemeStyles(baseStyles);
  const { parentGateOpen, setParentGateOpen, handleParentGateSuccess } = useAppStore();
  const [challenge, setChallenge] = useState<MathChallenge>(()=>generateParentGateChallenge());
  const [userAnswer, setUserAnswer] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleClose = () => {
    soundService.playPop();
    setParentGateOpen(false);
  };

  const handleCheck = () => {
    if (!challenge) return;
    const isCorrect = verifyParentGateAnswer(challenge.answer, userAnswer);

    if (isCorrect) {
      soundService.playCorrect(false);
      handleParentGateSuccess();
    } else {
      soundService.playEncouragingTryAgain();
      setErrorText('وەڵامەکە دروست نەبوو، تکایە دووبارە تاقی بکەرەوە.');
      setUserAnswer('');
      setChallenge(generateParentGateChallenge());
    }
  };

  if (!parentGateOpen || !challenge) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={parentGateOpen}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View {...rtlProps} style={[styles.backdrop, rtlLayout]}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.gateCard} keyboardShouldPersistTaps="handled">
            <View style={styles.iconCircle}>
              <PapulaMascot size={56} mood="calm" />
            </View>
            <Text style={styles.title}>ناوچەی دایک و باوک</Text>
            <Text style={styles.subtitle}>
              با پێکەوە چاودێری گەشتی فێربوونی بکەین. بۆ چوونەژوورەوە وەڵامی ئەم پرسیارە بدەن.
            </Text>

            <View style={styles.challengeBox}>
              <Text style={styles.challengeText}>{challenge.questionKu}</Text>
            </View>

            <TextInput
              accessibilityLabel="وەڵامی پرسیاری دایک و باوک"
              value={userAnswer}
              onChangeText={(txt) => {
                setUserAnswer(txt);
                setErrorText('');
              }}
              placeholder="وەڵامەکەت لێرە بنووسە..."
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              style={styles.input}
              maxLength={4}
              onSubmitEditing={handleCheck}
              autoFocus
            />

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleClose}
                style={[styles.btn, styles.cancelBtn]}
                activeOpacity={0.8}
              >
                <X size={16} color="#64748b" style={{ marginEnd: 4 }} />
                <Text style={styles.cancelBtnText}>پاشگەزبوونەوە</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{disabled:!userAnswer.trim()}}
                disabled={!userAnswer.trim()}
                onPress={handleCheck}
                style={[styles.btn, styles.confirmBtn,!userAnswer.trim()&&{opacity:0.5}]}
                activeOpacity={0.8}
              >
                <Check size={16} color="#ffffff" style={{ marginEnd: 4 }} />
                <Text style={styles.confirmBtnText}>کردنەوە</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const baseStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 37, 33, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scroll: {width:'100%',maxWidth:420,maxHeight:'100%',flexGrow:0},
  gateCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: '#e3f5ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 23,
    fontFamily:'IBMPlexSansArabic_700Bold',
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight:25,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  challengeBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  challengeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
  },
  input: {
    width: '100%',
    backgroundColor: '#f4f9f6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0f172a',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    minHeight:56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection:'row',
    gap:6,
  },
  cancelBtn: {
    backgroundColor: '#f4f9f6',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
  confirmBtn: {
    backgroundColor: '#23875f',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
});
