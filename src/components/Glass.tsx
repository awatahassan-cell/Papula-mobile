import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppearance } from '../theme/useAppearance';

/** Frosted card used by the day and night looks: big radius, hairline edge, soft coloured shadow. */
export const Glass: React.FC<{ children?: React.ReactNode; style?: StyleProp<ViewStyle>; radius?: number; testID?: string }> = ({ children, style, radius = 28, testID }) => {
  const { extras, colors, isNight } = useAppearance();
  return <View testID={testID} style={[{
    backgroundColor: extras.glass, borderColor: extras.glassEdge, borderWidth: 1.5, borderRadius: radius,
    shadowColor: isNight ? '#000000' : colors.mintDark, shadowOpacity: isNight ? 0.35 : 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5,
  }, style]}>{children}</View>;
};
