import React from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { HStack, Text, useTheme } from '@shared/ui';

interface NetworkStatusBannerProps {
  compact?: boolean;
  hideWhenOnline?: boolean;
  onlineLabel?: string;
  offlineLabel?: string;
}

export function NetworkStatusBanner({
  compact = false,
  hideWhenOnline = false,
  onlineLabel = 'Conectado à internet',
  offlineLabel = 'Offline',
}: NetworkStatusBannerProps): React.JSX.Element | null {
  const netInfo = useNetInfo();
  const { colors } = useTheme();

  const isOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;

  if (!isOffline && hideWhenOnline) {
    return null;
  }

  return (
    <HStack
      className="items-center justify-center rounded-xl border px-3"
      style={{
        backgroundColor: isOffline ? colors.dangerSoft : colors.successSoft,
        borderColor: isOffline
          ? colors.dangerBorder
          : '#A7F3D0',
        paddingVertical: compact ? 6 : 9,
      }}
      space="xs"
    >
      <MaterialCommunityIcons
        name={isOffline ? 'wifi-off' : 'wifi-check'}
        size={16}
        color={isOffline ? colors.danger : colors.success}
      />
      <Text
        className="text-[12px] leading-4"
        style={{ color: isOffline ? colors.danger : colors.success }}
        weight="bold"
      >
        {isOffline ? offlineLabel : onlineLabel}
      </Text>
    </HStack>
  );
}
