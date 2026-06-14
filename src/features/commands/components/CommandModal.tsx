import React from 'react';
import { Modal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Box, Button, ButtonText, Text, VStack } from '@shared/ui';
import type { Command } from '../types';

interface CommandModalProps {
  command: Command | null;
  onAcknowledge: () => void;
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
