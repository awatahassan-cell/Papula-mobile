import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { soundService } from './soundService';

/** Small physical feedback for buttons and answers. Silent on the web, and off when the parent turned sound effects off. */
const run = (job: () => Promise<void>) => {
  if (Platform.OS === 'web' || !soundService.isFxEnabled()) return;
  void job().catch(() => { /* devices without a vibration motor */ });
};
export const haptics = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  tryAgain: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
