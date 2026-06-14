import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from './utils';

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor = '#98A2B3', ...props }, ref) => (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor}
      className={cn(
        'min-h-12 rounded-ui border border-border bg-white px-4 text-base text-foreground',
        'focus:border-primary-500',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

