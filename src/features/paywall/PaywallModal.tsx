import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { X, Crown, Check } from 'lucide-react-native';
import { BigButton } from '../../components/BigButton';
import { authRepo } from '../../services/repositories';
import { soundService } from '../../services/soundService';
import { useAppStore } from '../../store/useAppStore';

export const PaywallModal: React.FC = () => {
  const { paywallOpen, setPaywallOpen, updateParentSettings, triggerConfetti, strings } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  if (!paywallOpen) return null;

  const handleSubscribe = async () => {
    soundService.playPop();
    setLoading(true);
    await authRepo.mockSubscribe(selectedPlan);
    updateParentSettings({ isSubscribed: true, activePlan: selectedPlan });
    setLoading(false);
    setSuccessToast(true);
    soundService.playSuccessFanfare();
    triggerConfetti();

    setTimeout(() => {
      setSuccessToast(false);
      setPaywallOpen(false);
    }, 1800);
  };

  const handleRestore = async () => {
    soundService.playPop();
    setLoading(true);
    await authRepo.mockRestorePurchases();
    updateParentSettings({ isSubscribed: true, activePlan: 'yearly' });
    setLoading(false);
    setSuccessToast(true);
    soundService.playSuccessFanfare();
    triggerConfetti();

    setTimeout(() => {
      setSuccessToast(false);
      setPaywallOpen(false);
    }, 1800);
  };

  const handleClose = () => {
    soundService.playPop();
    setPaywallOpen(false);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={paywallOpen}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X size={20} color="#64748b" />
          </TouchableOpacity>

          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Crown size={36} color="#d97706" />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{strings.paywall.trialBadge}</Text>
          </View>

          <Text style={styles.title}>{strings.paywall.title}</Text>
          <Text style={styles.subtitle}>{strings.paywall.subtitle}</Text>

          {/* Pricing Plans Choice */}
          <View style={styles.plansRow}>
            {/* Yearly */}
            <TouchableOpacity
              onPress={() => {
                soundService.playPop();
                setSelectedPlan('yearly');
              }}
              style={[
                styles.planBox,
                selectedPlan === 'yearly' && styles.planBoxSelected,
              ]}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{strings.paywall.savePercentage}</Text>
              </View>
              <Text style={styles.planName}>{strings.paywall.yearlyPlan}</Text>
              <Text style={styles.planPrice}>{strings.paywall.yearlyPrice}</Text>
              <Text style={styles.planNote}>٧ ڕۆژ بە خۆڕایی</Text>
            </TouchableOpacity>

            {/* Monthly */}
            <TouchableOpacity
              onPress={() => {
                soundService.playPop();
                setSelectedPlan('monthly');
              }}
              style={[
                styles.planBox,
                selectedPlan === 'monthly' && styles.planBoxSelected,
              ]}
            >
              <Text style={styles.planName}>{strings.paywall.monthlyPlan}</Text>
              <Text style={styles.planPrice}>{strings.paywall.monthlyPrice}</Text>
              <Text style={styles.planNote}>هەر کاتێک بتەوێت بوەستێنە</Text>
            </TouchableOpacity>
          </View>

          {/* Feature List */}
          <View style={styles.featuresBox}>
            {strings.paywall.featuresList.map((feat, i) => (
              <View key={i} style={styles.featureItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <BigButton
            onPress={handleSubscribe}
            variant="primary"
            size="lg"
            disabled={loading}
            style={styles.subscribeBtn}
          >
            {loading ? 'چاوەڕوانبە...' : strings.paywall.subscribeButton}
          </BigButton>

          <TouchableOpacity onPress={handleRestore} disabled={loading} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>{strings.paywall.restoreButton}</Text>
          </TouchableOpacity>

          {successToast && (
            <View style={styles.successToast}>
              <Text style={styles.successToastText}>
                پیرۆزە! بەشداریکردنی نمایشی کارا کرا 🎉
              </Text>
            </View>
          )}

          <Text style={styles.mockNote}>{strings.paywall.mockNote}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
  },
  crown: {
    fontSize: 48,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400e',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  planBox: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    position: 'relative',
  },
  planBoxSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 8,
    backgroundColor: '#f43f5e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  planName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#b45309',
    marginBottom: 2,
  },
  planNote: {
    fontSize: 9,
    color: '#64748b',
  },
  featuresBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    gap: 6,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  checkIcon: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 14,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  subscribeBtn: {
    width: '100%',
    marginBottom: 8,
  },
  restoreBtn: {
    padding: 6,
  },
  restoreText: {
    fontSize: 11,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  successToast: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  successToastText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '800',
  },
  mockNote: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});
