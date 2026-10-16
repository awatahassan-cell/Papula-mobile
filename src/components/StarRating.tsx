import { useThemeStyles } from '../theme/useAppearance';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './RTLText';

interface StarRatingProps {
  stars: number; // 0 to 3
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  stars,
  maxStars = 3,
  size = 'md',
}) => {
  const styles = useThemeStyles(baseStyles);
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 28;
      default:
        return 20;
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Text
          key={i}
          style={[
            { fontSize: getFontSize() },
            i < stars ? styles.starFilled : styles.starEmpty,
          ]}
        >
          {i < stars ? '⭐' : '☆'}
        </Text>
      ))}
    </View>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starFilled: {
    color: '#f59e0b',
  },
  starEmpty: {
    color: '#cbd5e1',
  },
});
