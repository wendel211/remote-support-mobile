import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from './utils';

type StackSpace = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const spaceClass: Record<StackSpace, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
};

export interface HStackProps extends ViewProps {
  className?: string;
  space?: StackSpace;
}

export const HStack = React.forwardRef<View, HStackProps>(
  ({ className, space = 'md', ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex-row items-center', spaceClass[space], className)}
      {...props}
    />
  ),
);

HStack.displayName = 'HStack';

