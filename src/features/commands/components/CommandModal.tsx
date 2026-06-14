import React from 'react';
import { Modal, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Box, Button, ButtonText, HStack, Text, VStack } from '@shared/ui';
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

  return (
    <Modal
      visible={command !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Box className="flex-1 items-center justify-center bg-black/60 px-8">
        <Box className="w-full rounded-panel bg-surface px-6 py-8 shadow-soft">
          <VStack className="items-center" space="md">
            {command ? (
              <Box className="h-16 w-16 items-center justify-center rounded-full bg-slate-100 shadow-inner">
                <MaterialCommunityIcons name={COMMAND_ICONS[command.type]} size={36} color="#334155" />
              </Box>
            ) : null}

            <VStack className="items-center" space="xs">
              <Text
                className="uppercase tracking-[0.8px]"
                size="sm"
                tone="muted"
                weight="semibold"
              >
                Comando recebido
              </Text>
              <Text className="text-center" size="xl" weight="bold">
                {command?.label ?? ''}
              </Text>
              {commandDescription ? (
                <Text className="text-center" size="sm" tone="muted">
                  {commandDescription}
                </Text>
              ) : null}
            </VStack>

            {command?.type === 'NAVIGATE_URL' && command.payload?.url ? (
              <Box className="w-full rounded-ui bg-primary-50 px-4 py-3">
                <Text
                  className="text-center"
                  numberOfLines={2}
                  size="sm"
                  tone="primary"
                  weight="medium"
                >
                  {command.payload.url}
                </Text>
              </Box>
            ) : null}

            {deviceInfo.length > 0 ? (
              <VStack className="w-full rounded-ui bg-slate-50 px-4 py-3" space="xs">
                {deviceInfo.map((item) => (
                  <HStack key={item.label} className="justify-between" space="sm">
                    <Text size="sm" tone="muted">
                      {item.label}
                    </Text>
                    <Text className="flex-1 text-right" size="sm" weight="semibold">
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
