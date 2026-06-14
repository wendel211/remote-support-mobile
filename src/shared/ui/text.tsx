import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from './utils';
import { getPoppinsTextStyle } from './typography';

type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type TextTone = 'default' | 'muted' | 'inverse' | 'primary' | 'danger' | 'success';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const sizeClass: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

const toneClass: Record<TextTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted',
  inverse: 'text-white',
  primary: 'text-primary-600',
  danger: 'text-danger-600',
  success: 'text-accent-600',
};

const weightClass: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export interface TextProps extends RNTextProps {
  className?: string;
  size?: TextSize;
  tone?: TextTone;
  weight?: TextWeight;
}

export const Text = React.forwardRef<RNText, TextProps>(
  (
    {
      className,
      size = 'md',
      tone = 'default',
      weight = 'regular',
      style,
      ...props
    },
    ref,
  ) => (
    <RNText
      ref={ref}
      className={cn(sizeClass[size], toneClass[tone], weightClass[weight], className)}
      {...props}
      style={[getPoppinsTextStyle(weight), style]}
    />
  ),
);

Text.displayName = 'Text';
