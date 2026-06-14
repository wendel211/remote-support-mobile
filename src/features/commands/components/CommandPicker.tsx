import React, { useState } from 'react';
import { Alert, Platform, ScrollView } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Input,
  Text,
  VStack,
} from '@shared/ui';
import type { Command, CommandType } from '../types';

interface CommandPikerProps {
  sessionCode: string;
  onSend: (command: Omit<Command, 'id' | 'sentAt' | 'acknowledgedAt'>) => void;
}

interface CommandDefinition {
  type: CommandType;
  label: string;
  emoji: string;
}

const COMMAND_DEFINITIONS: CommandDefinition[] = [
  { type: 'OPEN_SETTINGS', label: 'Configurações', emoji: '⚙️' },
  { type: 'RESTART_APP', label: 'Reiniciar app', emoji: '🔄' },
  { type: 'NAVIGATE_URL', label: 'Abrir URL', emoji: '🌐' },
  { type: 'CLEAR_CACHE', label: 'Limpar cache', emoji: '🗑️' },
  { type: 'SHOW_INFO', label: 'Info do dispositivo', emoji: 'ℹ️' },
];

export function CommandPicker({
  onSend,
}: CommandPikerProps): React.JSX.Element {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleCommand = (definition: CommandDefinition): void => {
    if (definition.type === 'NAVIGATE_URL') {
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Navegar para URL',
          'Digite a URL de destino:',
          (url) => {
            if (url && url.trim().length > 0) {
              onSend({
                type: 'NAVIGATE_URL',
                label: 'Navegar para URL',
                payload: { url: url.trim() },
              });
            }
          },
          'plain-text',
          '',
          'url',
        );
      } else {
        setShowUrlInput(true);
      }
      return;
    }

    onSend({
      type: definition.type,
      label: definition.label,
    });
  };

  const handleConfirmUrl = (): void => {
    const trimmed = urlInput.trim();
    if (trimmed.length > 0) {
      onSend({
        type: 'NAVIGATE_URL',
        label: 'Navegar para URL',
        payload: { url: trimmed },
      });
    }
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleCancelUrl = (): void => {
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <Box className="border-b border-border bg-surface px-4 py-3">
      <VStack space="sm">
        <HStack className="justify-between">
          <Text
            className="uppercase tracking-[0.8px]"
            size="xs"
            tone="muted"
            weight="semibold"
          >
            Comandos
          </Text>
          <Text size="xs" tone="muted">
            Envio imediato
          </Text>
        </HStack>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        >
          {COMMAND_DEFINITIONS.map((definition) => (
            <Button
              key={definition.type}
              className="min-h-10 justify-start px-3"
              variant="outline"
              tone="secondary"
              onPress={() => handleCommand(definition)}
            >
              <HStack space="sm">
                <Text>{definition.emoji}</Text>
                <ButtonText
                  className="shrink"
                  variant="outline"
                  tone="secondary"
                  size="sm"
                  numberOfLines={1}
                >
                  {definition.label}
                </ButtonText>
              </HStack>
            </Button>
          ))}
        </ScrollView>

        {showUrlInput && (
          <Box className="mt-1 rounded-ui border border-primary-100 bg-primary-50 p-3">
            <VStack space="sm">
              <Text size="xs" tone="primary" weight="semibold">
                URL de destino
              </Text>
              <Input
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://exemplo.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <HStack space="sm">
                <Button
                  className="flex-1"
                  variant="outline"
                  tone="secondary"
                  onPress={handleCancelUrl}
                >
                  <ButtonText variant="outline" tone="secondary" size="sm">
                    Cancelar
                  </ButtonText>
                </Button>
                <Button className="flex-1" onPress={handleConfirmUrl}>
                  <ButtonText size="sm">Confirmar</ButtonText>
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
