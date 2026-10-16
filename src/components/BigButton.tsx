import { useAppearance, useThemeStyles } from '../theme/useAppearance';
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { usePressSink } from './Motion';
import { Text } from './RTLText';
import { useResponsive } from '../theme/responsive';
import { soundService } from '../services/soundService';

interface BigButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const BigButton: React.FC<BigButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const styles = useThemeStyles(baseStyles);
  const { tablet } = useResponsive();
  const press = usePressSink();
  const { isNight, extras } = useAppearance();
  // At night the main buttons glow gold, as in the night design.
  const gold = isNight && (variant === 'success' || variant === 'primary');
  const handlePress = () => {
    if (disabled) return;
    soundService.playPop();
    if (onPress) onPress();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'success':
        return styles.success;
      case 'outline':
        return styles.outline;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      default:
        return styles.sizeMd;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.textOutline;
      default:
        return styles.textLight;
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={handlePress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      activeOpacity={0.9}
      style={[
        styles.buttonBase,
        tablet && styles.tabletCentered,
        getVariantStyle(),
        getSizeStyle(),
        gold && { backgroundColor: extras.cta, shadowColor: extras.cta, shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
        disabled && styles.disabled,
        style,
        press.sinkStyle,
      ]}
    >
      {icon && icon}
      {typeof children === 'string' ? (
        <Text style={[styles.textBase, getTextStyle(), gold && { color: extras.ctaText }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// On tablets a full-width button would stretch across the page: keep it a comfortable, centred size.
const baseStyles = StyleSheet.create({
  tabletCentered: { maxWidth: 460, alignSelf: 'center' },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    minHeight: 54,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primary: {
    backgroundColor: '#f59e0b',
  },
  secondary: {
    backgroundColor: '#38bdf8',
  },
  success: {
    backgroundColor: '#10b981',
  },
  outline: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  danger: {
    backgroundColor: '#ef4444',
  },
  disabled: {
    opacity: 0.5,
  },
  sizeSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: 999,
  },
  sizeMd: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  sizeLg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 999,
  },
  textBase: {
    fontFamily: 'IBMPlexSansArabic_700Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  textLight: {
    color: '#ffffff',
  },
  textOutline: {
    color: '#b45309',
  },
});
