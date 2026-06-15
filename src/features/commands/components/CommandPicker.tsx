import React, { useState } from 'react';
import { Alert, Platform, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Input,
  Text,
  VStack,
  useTheme,
} from '@shared/ui';
import type { Command, CommandType } from '../types';

interface CommandPickerProps {
  sessionCode: string;
  onSend: (command: Omit<Command, 'id' | 'sentAt' | 'acknowledgedAt'>) => void;
}

interface CommandDefinition {
  type: CommandType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const COMMAND_DEFINITIONS: CommandDefinition[] = [
  { type: 'OPEN_SETTINGS', label: 'Configurações', icon: 'cog' },
  { type: 'RESTART_APP', label: 'Reiniciar app', icon: 'restart' },
  { type: 'NAVIGATE_URL', label: 'Abrir URL', icon: 'link' },
  { type: 'CLEAR_CACHE', label: 'Limpar cache', icon: 'trash-can' },
  { type: 'SHOW_INFO', label: 'Informações do dispositivo', icon: 'information' },
];

export function CommandPicker({
  onSend,
}: CommandPickerProps): React.JSX.Element {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const { isDark, colors } = useTheme();

  const sendUrlCommand = (url: string): void => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    onSend({
      type: 'NAVIGATE_URL',
      label: 'Navegar para URL',
      payload: { url: normalizedUrl },
    });
  };

  const handleCommand = (definition: CommandDefinition): void => {
    if (definition.type === 'NAVIGATE_URL') {
      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Navegar para URL',
          'Digite a URL de destino:',
          (url) => {
            if (url) {
              sendUrlCommand(url);
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
    sendUrlCommand(urlInput);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleCancelUrl = (): void => {
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <Box
      className="border-b px-4 py-3"
      style={{
        backgroundColor: colors.card,
        borderBottomColor: colors.separator,
      }}
    >
      <VStack space="sm">
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
              <HStack space="xs" style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name={definition.icon} size={16} color={colors.textSecondary} />
                <ButtonText
                  className="shrink"
                  variant="outline"
                  tone="secondary"
                  size="sm"
                  numberOfLines={1}
                  style={{ color: colors.text }}
                >
                  {definition.label}
                </ButtonText>
              </HStack>
            </Button>
          ))}
        </ScrollView>

        {showUrlInput && (
          <Box
            className="mt-1 rounded-ui p-3"
            style={{
              backgroundColor: isDark ? colors.surfaceElevated : '#EFF6FF',
              borderWidth: 1,
              borderColor: isDark ? colors.cardBorder : '#DBEAFE',
            }}
          >
            <VStack space="sm">
              <Text size="xs" weight="semibold" style={{ color: colors.accent }}>
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
