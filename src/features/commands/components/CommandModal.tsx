import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Box, Button, ButtonText, HStack, Text, VStack, useTheme } from '@shared/ui';
import { useRenderMetric } from '@features/performance';
import type { Command } from '../types';

interface CommandModalProps {
  command: Command | null;
  sessionCode?: string;
  onAcknowledge: () => void | Promise<void>;
}

const COMMAND_ICONS: Record<Command['type'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  OPEN_SETTINGS: 'cog',
  RESTART_APP: 'restart',
  NAVIGATE_URL: 'link',
  CLEAR_CACHE: 'trash-can',
  SHOW_INFO: 'information',
};

export function CommandModal({
  command,
  sessionCode,
  onAcknowledge,
}: CommandModalProps): React.JSX.Element {
  useRenderMetric('CommandModal');
  const { isDark, colors } = useTheme();
  const modalAnim = useRef(new Animated.Value(0)).current;
  const commandDescription = getCommandDescription(command);
  const deviceInfo = command?.type === 'SHOW_INFO'
    ? [
        { label: 'Perfil', value: 'Cliente' },
        { label: 'Sessão', value: sessionCode ?? '-' },
        { label: 'Plataforma', value: Platform.OS },
        { label: 'Versão do sistema', value: String(Platform.Version) },
        { label: 'Status', value: 'Conectado' },
      ]
    : [];

  useEffect(() => {
    if (!command) {
      modalAnim.setValue(0);
      return;
    }

    Animated.spring(modalAnim, {
      toValue: 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [command, modalAnim]);

  return (
    <Modal
      visible={command !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Box
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: colors.overlay }}
      >
        <Animated.View
          style={{
            width: '100%',
            opacity: modalAnim,
            transform: [
              {
                scale: modalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 1],
                }),
              },
            ],
          }}
        >
          <Box
            className="w-full rounded-panel px-6 py-8"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <VStack className="items-center" space="md">
              {command ? (
                <Box
                  className="h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.surfaceElevated }}
                >
                  <MaterialCommunityIcons
                    name={COMMAND_ICONS[command.type]}
                    size={36}
                    color={colors.accent}
                  />
                </Box>
              ) : null}

              <VStack className="items-center" space="xs">
                <Text
                  className="uppercase tracking-[0.8px]"
                  size="sm"
                  style={{ color: colors.textSecondary }}
                  weight="semibold"
                >
                  Comando recebido
                </Text>
                <Text className="text-center" size="xl" weight="bold" style={{ color: colors.text }}>
                  {command?.label ?? ''}
                </Text>
                {commandDescription ? (
                  <Text className="text-center" size="sm" style={{ color: colors.textSecondary }}>
                    {commandDescription}
                  </Text>
                ) : null}
              </VStack>

              {command?.type === 'NAVIGATE_URL' && command.payload?.url ? (
                <Box
                  className="w-full rounded-ui px-4 py-3"
                  style={{ backgroundColor: isDark ? colors.surfaceElevated : '#EFF6FF' }}
                >
                  <Text
                    className="text-center"
                    numberOfLines={2}
                    size="sm"
                    weight="medium"
                    style={{ color: colors.accent }}
                  >
                    {command.payload.url}
                  </Text>
                </Box>
              ) : null}

              {deviceInfo.length > 0 ? (
                <VStack
                  className="w-full rounded-ui px-4 py-3"
                  style={{ backgroundColor: colors.surfaceElevated }}
                  space="xs"
                >
                  {deviceInfo.map((item) => (
                    <HStack key={item.label} className="justify-between" space="sm">
                      <Text size="sm" style={{ color: colors.textSecondary }}>
                        {item.label}
                      </Text>
                      <Text
                        className="flex-1 text-right"
                        size="sm"
                        weight="semibold"
                        style={{ color: colors.text }}
                      >
                        {item.value}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              ) : null}

              <Button className="mt-2 w-full" onPress={onAcknowledge}>
                <ButtonText>Entendido</ButtonText>
              </Button>
            </VStack>
          </Box>
        </Animated.View>
      </Box>
    </Modal>
  );
}

function getCommandDescription(command: Command | null): string | null {
  switch (command?.type) {
    case 'OPEN_SETTINGS':
      return 'As configurações do dispositivo serão abertas no cliente.';
    case 'RESTART_APP':
      return 'O app será recarregado localmente no dispositivo do cliente.';
    case 'CLEAR_CACHE':
      return 'Mensagens em memória e capturas locais serão limpas no cliente.';
    case 'SHOW_INFO':
      return 'Informações básicas do dispositivo e da sessão atual.';
    case 'NAVIGATE_URL':
      return 'A URL será aberta automaticamente no app do cliente.';
    default:
      return null;
  }
}
