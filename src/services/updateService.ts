import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

export interface UpdateConfig {
  latestVersionCode: number;
  latestVersionName: string;
  minSupportedVersionCode?: number;
  title?: string;
  message?: string;
  releaseNotes?: string[];
  playStoreUrl?: string;
  isMandatory?: boolean;
}

export interface CheckUpdateResult {
  hasUpdate: boolean;
  config?: UpdateConfig;
  reason?: 'up_to_date' | 'dismissed' | 'fetch_failed' | 'available';
  message?: string;
}

export const CURRENT_VERSION_CODE = 6;
export const CURRENT_VERSION_NAME = '1.0.5';
export const APP_PACKAGE_NAME = 'com.papula.kids';

export const PRIMARY_CONFIG_URL = 'https://paupla.chimanova.com/api/version.json';
export const FALLBACK_CONFIG_URL = 'https://awatahassan-cell.github.io/Papula-mobile/api/version.json';

const DISMISSED_VERSION_KEY = '@papula/dismissed_update_version';
const LAST_CHECK_KEY = '@papula/last_update_check_timestamp';

/**
 * Compares remote version with local version.
 */
export function isUpdateAvailable(
  remoteVersionCode: number,
  localVersionCode: number = CURRENT_VERSION_CODE
): boolean {
  return typeof remoteVersionCode === 'number' && remoteVersionCode > localVersionCode;
}

/**
 * Checks if a specific version code was dismissed by the user.
 */
export async function isVersionDismissed(versionCode: number): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_VERSION_KEY);
    if (!raw) return false;
    const dismissed = parseInt(raw, 10);
    return dismissed >= versionCode;
  } catch {
    return false;
  }
}

/**
 * Saves dismissed version so user is not prompted again until a higher version is published.
 */
export async function dismissUpdate(versionCode: number): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_VERSION_KEY, String(versionCode));
  } catch {
    // Silent ignore
  }
}

/**
 * Clears dismissed version state (useful for tests and resets).
 */
export async function resetDismissedUpdate(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DISMISSED_VERSION_KEY);
  } catch {
    // Silent ignore
  }
}

/**
 * Fetches JSON config with timeout.
 */
async function fetchConfigWithTimeout(url: string, timeoutMs = 4000): Promise<UpdateConfig | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = setTimeout(() => {
    controller?.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller?.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    if (data && typeof data.latestVersionCode === 'number') {
      return data as UpdateConfig;
    }
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Main update check.
 * - In automated mode (manual=false): respects user dismissal and runs silently.
 * - In manual mode (manual=true): ignores dismissal and reports clear feedback.
 */
export async function checkRemoteUpdate(manual = false): Promise<CheckUpdateResult> {
  try {
    // 1. Fetch remote config (primary with fallback)
    let config = await fetchConfigWithTimeout(PRIMARY_CONFIG_URL, 3500);
    if (!config) {
      config = await fetchConfigWithTimeout(FALLBACK_CONFIG_URL, 3500);
    }

    if (!config) {
      return {
        hasUpdate: false,
        reason: 'fetch_failed',
        message: 'پەیوەندی لەگەڵ سێرڤەر بەردەست نییە. دڵنیابە ئینتەرنێتت هەیە.',
      };
    }

    // 2. Compare version code
    const hasUpdate = isUpdateAvailable(config.latestVersionCode, CURRENT_VERSION_CODE);

    if (!hasUpdate) {
      return {
        hasUpdate: false,
        config,
        reason: 'up_to_date',
        message: 'ئەپڵیکەیشنی پەپوولە نوێترین وەشانە! ✨',
      };
    }

    // 3. If mandatory, always show
    if (config.isMandatory) {
      return {
        hasUpdate: true,
        config,
        reason: 'available',
      };
    }

    // 4. If automatic check and already dismissed, suppress modal
    if (!manual) {
      const isDismissed = await isVersionDismissed(config.latestVersionCode);
      if (isDismissed) {
        return {
          hasUpdate: false,
          config,
          reason: 'dismissed',
        };
      }
    }

    return {
      hasUpdate: true,
      config,
      reason: 'available',
    };
  } catch {
    return {
      hasUpdate: false,
      reason: 'fetch_failed',
      message: 'هەڵەیەک ڕوویدا لە کاتی پشکنینی وەشان.',
    };
  }
}

/**
 * Opens Google Play Store directly to Papula app listing.
 */
export async function openPlayStore(customUrl?: string): Promise<void> {
  const targetWebUrl = customUrl || `https://play.google.com/store/apps/details?id=${APP_PACKAGE_NAME}`;
  const marketUrl = `market://details?id=${APP_PACKAGE_NAME}`;

  try {
    if (Platform.OS === 'android') {
      const supported = await Linking.canOpenURL(marketUrl);
      if (supported) {
        await Linking.openURL(marketUrl);
        return;
      }
    }
    await Linking.openURL(targetWebUrl);
  } catch {
    // Fallback to web link
    try {
      await Linking.openURL(targetWebUrl);
    } catch {
      // Ignore if linking completely fails
    }
  }
}

export const updateService = {
  CURRENT_VERSION_CODE,
  CURRENT_VERSION_NAME,
  isUpdateAvailable,
  isVersionDismissed,
  dismissUpdate,
  resetDismissedUpdate,
  checkRemoteUpdate,
  openPlayStore,
};
