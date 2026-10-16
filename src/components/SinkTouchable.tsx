import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { usePressSink } from './Motion';

/** A TouchableOpacity that sinks into its bottom lip while pressed, like a real button. */
export const SinkTouchable: React.FC<TouchableOpacityProps> = ({ style, onPressIn, onPressOut, ...props }) => {
  const press = usePressSink();
  return <TouchableOpacity activeOpacity={0.9} {...props} style={[style, press.sinkStyle]}
    onPressIn={event => { press.onPressIn(); onPressIn?.(event); }} onPressOut={event => { press.onPressOut(); onPressOut?.(event); }} />;
};
