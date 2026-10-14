import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Lock, Check, X } from 'lucide-react-native';
import {
  generateParentGateChallenge,
  verifyParentGateAnswer,
  MathChallenge,
} from '../services/parentGate';
import { soundService } from '../services/soundService';
import { useAppStore } from '../store/useAppStore';

export const ParentGateModal: React.FC = () => {
  const { parentGateOpen, setParentGateOpen, handleParentGateSuccess } = useAppStore();
  const [challenge, setChallenge] = useState<MathChallenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (parentGateOpen) {
      setChallenge(generateParentGateChallenge());
      setUserAnswer('');
      setErrorText('');
    }
  }, [parentGateOpen]);

  const handleClose = () => {
    soundService.playPop();
    setParentGateOpen(false);
  };

  const handleCheck = () => {
    if (!challenge) return;
    const isCorrect = verifyParentGateAnswer(challenge.answer, userAnswer);

    if (isCorrect) {
      soundService.playCorrect();
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
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Lock size={32} color="#4f46e5" />
            </View>
            <Text style={styles.title}>ناوچەی دایک و باوک</Text>
            <Text style={styles.subtitle}>
              تکایە ئەم پرسیارە بیرکارییە چارەسەر بکە بۆ چوونەژوورەوە:
            </Text>

            <View style={styles.challengeBox}>
              <Text style={styles.challengeText}>{challenge.questionKu}</Text>
            </View>

            <TextInput
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
              autoFocus
            />

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={handleClose}
                style={[styles.btn, styles.cancelBtn]}
                activeOpacity={0.8}
              >
                <X size={16} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={styles.cancelBtnText}>پاشگەزبوونەوە</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCheck}
                style={[styles.btn, styles.confirmBtn]}
                activeOpacity={0.8}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.confirmBtnText}>کردنەوە</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  challengeBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1.5,
    borderRadius: 18,
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
    backgroundColor: '#f1f5f9',
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
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
  confirmBtn: {
    backgroundColor: '#f59e0b',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
});
