import React from 'react';
import { Modal } from 'react-native';
import { Box, Button, ButtonText, Text, VStack } from '@shared/ui';
import type { Command } from '../types';

interface CommandModalProps {
  command: Command | null;
  onAcknowledge: () => void;
}

const COMMAND_EMOJIS: Record<Command['type'], string> = {
  OPEN_SETTINGS: '⚙️',
  RESTART_APP: '🔄',
  NAVIGATE_URL: '🌐',
  CLEAR_CACHE: '🗑️',
  SHOW_INFO: 'ℹ️',
};

export function CommandModal({
  command,
  onAcknowledge,
}: CommandModalProps): React.JSX.Element {
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
            <Text className="text-5xl">
              {command ? COMMAND_EMOJIS[command.type] : ''}
            </Text>

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

            <Button className="mt-2 w-full" onPress={onAcknowledge}>
              <ButtonText>Entendido</ButtonText>
            </Button>
          </VStack>
        </Box>
      </Box>
    </Modal>
  );
}
