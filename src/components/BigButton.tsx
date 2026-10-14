import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
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
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.buttonBase,
        getVariantStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && icon}
      {typeof children === 'string' ? (
        <Text style={[styles.textBase, getTextStyle(), textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
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
    borderRadius: 16,
  },
  sizeMd: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sizeLg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
  },
  textBase: {
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  },
  textLight: {
    color: '#ffffff',
  },
  textOutline: {
    color: '#b45309',
  },
});
