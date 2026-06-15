import React from 'react';
import type { SessionStatus } from '@features/session/types';
import { Box, HStack, Text, useTheme } from '@shared/ui';

interface StatusBadgeProps {
  status: SessionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const { isDark, colors } = useTheme();

  const getStatusStyle = () => {
    switch (status) {
      case 'idle':
        return {
          dotColor: colors.textTertiary,
          textColor: colors.textSecondary,
          bgColor: isDark ? colors.surfaceElevated : '#F1F5F9',
          borderColor: colors.cardBorder,
          label: 'Inativo',
        };
      case 'waiting':
        return {
          dotColor: colors.warning,
          textColor: colors.warning,
          bgColor: colors.warningSoft,
          borderColor: colors.warningBorder,
          label: 'Aguardando',
        };
      case 'connected':
        return {
          dotColor: colors.success,
          textColor: colors.success,
          bgColor: colors.successSoft,
          borderColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#A7F3D0',
          label: 'Conectado',
        };
      case 'ended':
        return {
          dotColor: colors.danger,
          textColor: colors.danger,
          bgColor: colors.dangerSoft,
          borderColor: colors.dangerBorder,
          label: 'Encerrado',
        };
    }
  };

  const config = getStatusStyle();

  return (
    <HStack
      className="self-center rounded-full border px-2.5 py-0.5"
      style={{
        alignItems: 'center',
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
      space="xs"
    >
      <Box
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.dotColor }}
      />
      <Text
        style={{ color: config.textColor }}
        size="xs"
        weight="semibold"
      >
        {config.label}
      </Text>
    </HStack>
  );
}
