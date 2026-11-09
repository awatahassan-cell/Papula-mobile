import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { Text } from './RTLText';
import { TactileButton as TouchableOpacity } from './TactileButton';
import { PapulaMascot } from './PapulaMascot';
import { Sparkles, Download, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useAppearance } from '../theme/useAppearance';
import { rtlProps, rtlLayout } from '../theme/rtl';
import { useAppStore } from '../store/useAppStore';
import { updateService } from '../services/updateService';

export const InAppUpdateModal: React.FC = () => {
  const { colors: c } = useAppearance();
  const { updateModalOpen, setUpdateModalOpen, updateConfig } = useAppStore();

  if (!updateModalOpen || !updateConfig) return null;

  const isMandatory = !!updateConfig.isMandatory;
  const title = updateConfig.title || 'وەشانێکی نوێی پەپوولە بەردەستە! 🦋';
  const message =
    updateConfig.message ||
    'تایبەتمەندی و پیت و یاریی نوێ بۆ پەپوولە زیاد کراوە. تکایە ئەپەکە نوێ بکەرەوە بۆ ئەزموونێکی باشتر.';

  const handleUpdate = () => {
    void updateService.openPlayStore(updateConfig.playStoreUrl);
  };

  const handleDismiss = () => {
    if (isMandatory) return;
    void updateService.dismissUpdate(updateConfig.latestVersionCode);
    setUpdateModalOpen(false);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={updateModalOpen}
      onRequestClose={handleDismiss}
    >
      <View {...rtlProps} style={[styles.backdrop, rtlLayout]}>
        <View style={[styles.card, { backgroundColor: c.paper, borderColor: c.edge }]}>
          {/* Header & Mascot */}
          <View style={styles.headerArea}>
            <View style={[styles.mascotGlow, { backgroundColor: c.leaf }]}>
              <PapulaMascot size={90} mood="happy" />
            </View>
            <View style={[styles.badge, { backgroundColor: c.leaf, borderColor: c.mint }]}>
              <Sparkles size={14} color={c.mintDark} />
              <Text style={[styles.badgeText, { color: c.mintDark }]}>
                وەشانی نوێ: {updateConfig.latestVersionName}
              </Text>
            </View>
          </View>

          {/* Titles & Message */}
          <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
          <Text style={[styles.message, { color: c.muted }]}>{message}</Text>

          {/* Release Notes */}
          {updateConfig.releaseNotes && updateConfig.releaseNotes.length > 0 && (
            <View style={[styles.notesCard, { backgroundColor: c.background, borderColor: c.edge }]}>
              <Text style={[styles.notesHeading, { color: c.ink }]}>چی نوێیە لەم وەشانەدا؟</Text>
              {updateConfig.releaseNotes.map((note, idx) => (
                <View key={idx} style={styles.noteRow}>
                  <CheckCircle2 size={16} color={c.mint} style={{ marginTop: 2 }} />
                  <Text style={[styles.noteText, { color: c.ink }]}>{note}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="نوێکردنەوە لە Google Play"
              onPress={handleUpdate}
              style={[
                styles.primaryBtn,
                { backgroundColor: c.mint, borderBottomColor: c.mintDark },
              ]}
            >
              <Download size={20} color="#ffffff" />
              <Text style={styles.primaryBtnText}>نوێکردنەوە لە Google Play</Text>
            </TouchableOpacity>

            {!isMandatory && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="دواتر نوێی دەکەمەوە"
                onPress={handleDismiss}
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: c.lavender, borderColor: c.edge },
                ]}
              >
                <ArrowLeft size={17} color={c.ink} />
                <Text style={[styles.secondaryBtnText, { color: c.ink }]}>دواتر نوێی دەکەمەوە</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 32, 56, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 30,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  headerArea: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  mascotGlow: {
    width: 106,
    height: 106,
    borderRadius: 53,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    fontSize: 12,
  },
  title: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  notesCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  notesHeading: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    fontSize: 13,
    marginBottom: 2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 18,
    borderBottomWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  secondaryBtn: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontFamily: 'IBMPlexSansArabic_600SemiBold',
    fontSize: 13,
  },
});
