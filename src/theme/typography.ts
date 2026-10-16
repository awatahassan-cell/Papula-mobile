import { TextStyle } from 'react-native';

/** Static font faces work consistently on Android, iOS and web. */
export function ibmTextStyle(style: TextStyle = {}): TextStyle {
  const family = style.fontFamily || '';
  const weight = Number(style.fontWeight) || (style.fontWeight === 'bold' ? 700 : /600|SemiBold/.test(family) ? 600
    : /700|Bold/.test(family) ? 700 : /500|Medium/.test(family) ? 500 : 400);
  return { fontFamily: weight >= 700 ? 'IBMPlexSansArabic_700Bold' : weight >= 600 ? 'IBMPlexSansArabic_600SemiBold'
    : weight >= 500 ? 'IBMPlexSansArabic_500Medium' : 'IBMPlexSansArabic_400Regular', fontWeight: 'normal' };
}
