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

export interface VStackProps extends ViewProps {
  className?: string;
  space?: StackSpace;
}

export const VStack = React.forwardRef<View, VStackProps>(
  ({ className, space = 'md', ...props }, ref) => (
    <View ref={ref} className={cn('flex-col', spaceClass[space], className)} {...props} />
  ),
);

VStack.displayName = 'VStack';

