import React from 'react';
import { View, Text, type ViewProps, type TextProps } from 'react-native';
import { cn } from './utils';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const badgeToneClass: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 border-slate-200',
  primary: 'bg-primary-50 border-primary-100',
  success: 'bg-accent-50 border-emerald-100',
  warning: 'bg-warning-50 border-orange-100',
  danger: 'bg-danger-50 border-red-100',
};

const badgeTextToneClass: Record<BadgeTone, string> = {
  neutral: 'text-slate-700',
  primary: 'text-primary-700',
  success: 'text-accent-600',
  warning: 'text-warning-500',
  danger: 'text-danger-600',
};

export interface BadgeProps extends ViewProps {
  className?: string;
  tone?: BadgeTone;
}

export const Badge = React.forwardRef<View, BadgeProps>(
  ({ className, tone = 'neutral', ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'self-start rounded-full border px-3 py-1',
        badgeToneClass[tone],
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = 'Badge';

export interface BadgeTextProps extends TextProps {
  className?: string;
  tone?: BadgeTone;
}

export const BadgeText = React.forwardRef<Text, BadgeTextProps>(
  ({ className, tone = 'neutral', ...props }, ref) => (
    <Text
      ref={ref}
      className={cn('text-xs font-semibold', badgeTextToneClass[tone], className)}
      {...props}
    />
  ),
);

BadgeText.displayName = 'BadgeText';

