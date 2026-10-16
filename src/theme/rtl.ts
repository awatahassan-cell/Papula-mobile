import { Platform } from 'react-native';

// Web's locale context needs dir as well as the native layout direction.
export const rtlProps = Platform.OS === 'web' ? { dir: 'rtl' as const } : {};
export const rtlLayout = { direction: 'rtl' as const };