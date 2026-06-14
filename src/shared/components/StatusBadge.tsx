import React from 'react';
import type { SessionStatus } from '@features/session/types';
import { Box, HStack, Text } from '@shared/ui';

interface StatusBadgeProps {
  status: SessionStatus;
}

const STATUS_CONFIG: Record<
  SessionStatus,
  { dotClass: string; label: string; labelClass: string; surfaceClass: string }
> = {
  idle: {
    dotClass: 'bg-slate-400',
    label: 'Inativo',
    labelClass: 'text-slate-600',
    surfaceClass: 'bg-slate-100 border-slate-200',
  },
  waiting: {
    dotClass: 'bg-warning-500',
    label: 'Aguardando',
    labelClass: 'text-warning-500',
    surfaceClass: 'bg-warning-50 border-orange-100',
  },
  connected: {
    dotClass: 'bg-accent-500',
    label: 'Conectado',
    labelClass: 'text-accent-600',
    surfaceClass: 'bg-accent-50 border-emerald-100',
  },
  ended: {
    dotClass: 'bg-danger-500',
    label: 'Encerrado',
    labelClass: 'text-danger-600',
    surfaceClass: 'bg-danger-50 border-red-100',
  },
};

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const config = STATUS_CONFIG[status];

  return (
    <HStack
      className={`self-center rounded-full border px-2.5 py-0.5 ${config.surfaceClass}`}
      style={{ alignItems: 'center' }}
      space="xs"
    >
      <Box className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      <Text
        className={config.labelClass}
        size="xs"
        weight="semibold"
      >
        {config.label}
      </Text>
    </HStack>
  );
}
