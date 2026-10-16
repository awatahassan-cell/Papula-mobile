import React from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { useAppearance } from '../theme/useAppearance';

/**
 * Frosted card used by the day and night looks: big radius, hairline edge, soft coloured shadow.
 * Android draws its elevation shadow *through* a translucent fill (a visible grey box), so there the fill is solid.
 */
export const Glass: React.FC<{ children?: React.ReactNode; style?: StyleProp<ViewStyle>; radius?: number; testID?: string }> = ({ children, style, radius = 28, testID }) => {
  const { extras, colors, isNight } = useAppearance();
  const fill = Platform.OS === 'android' ? (isNight ? colors.paper : '#ffffff') : extras.glass;
  return <View testID={testID} style={[{
    backgroundColor: fill, borderColor: extras.glassEdge, borderWidth: 1.5, borderRadius: radius,
    shadowColor: isNight ? '#000000' : colors.mintDark, shadowOpacity: isNight ? 0.35 : 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  }, style]}>{children}</View>;
};
