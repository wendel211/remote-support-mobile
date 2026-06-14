import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type TextProps,
  type View,
} from 'react-native';
import { cn } from './utils';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantToneClass: Record<ButtonVariant, Record<ButtonTone, string>> = {
  solid: {
    primary: 'bg-primary-600 border-primary-600',
    secondary: 'bg-slate-900 border-slate-900',
    danger: 'bg-danger-500 border-danger-500',
    success: 'bg-accent-600 border-accent-600',
  },
  outline: {
    primary: 'bg-transparent border-primary-600',
    secondary: 'bg-transparent border-border',
    danger: 'bg-transparent border-danger-500',
    success: 'bg-transparent border-accent-600',
  },
  ghost: {
    primary: 'bg-transparent border-transparent',
    secondary: 'bg-transparent border-transparent',
    danger: 'bg-transparent border-transparent',
    success: 'bg-transparent border-transparent',
  },
};

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4',
  md: 'min-h-12 px-5',
  lg: 'min-h-14 px-6',
};

const textToneClass: Record<ButtonVariant, Record<ButtonTone, string>> = {
  solid: {
    primary: 'text-white',
    secondary: 'text-white',
    danger: 'text-white',
    success: 'text-white',
  },
  outline: {
    primary: 'text-primary-600',
    secondary: 'text-foreground',
    danger: 'text-danger-600',
    success: 'text-accent-600',
  },
  ghost: {
    primary: 'text-primary-600',
    secondary: 'text-foreground',
    danger: 'text-danger-600',
    success: 'text-accent-600',
  },
};

const textSizeClass: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export interface ButtonProps extends PressableProps {
  className?: string;
  isLoading?: boolean;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      className,
      disabled,
      isLoading = false,
      variant = 'solid',
      tone = 'primary',
      size = 'md',
      children,
      ...props
    },
    ref,
  ) => (
    <Pressable
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'flex-row items-center justify-center rounded-ui border active:opacity-85',
        buttonSizeClass[size],
        variantToneClass[variant][tone],
        (disabled || isLoading) && 'opacity-50',
        className,
      )}
      {...props}
    >
      {isLoading ? <ActivityIndicator color={variant === 'solid' ? '#FFFFFF' : '#315DFF'} /> : children}
    </Pressable>
  ),
);

Button.displayName = 'Button';

export interface ButtonTextProps extends TextProps {
  className?: string;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
}

export const ButtonText = React.forwardRef<Text, ButtonTextProps>(
  (
    {
      className,
      variant = 'solid',
      tone = 'primary',
      size = 'md',
      ...props
    },
    ref,
  ) => (
    <Text
      ref={ref}
      className={cn(
        'font-semibold',
        textSizeClass[size],
        textToneClass[variant][tone],
        className,
      )}
      {...props}
    />
  ),
);

ButtonText.displayName = 'ButtonText';

