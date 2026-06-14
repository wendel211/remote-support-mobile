import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import {
  Badge,
  BadgeText,
  Box,
  Button,
  ButtonText,
  HStack,
  Text,
  VStack,
} from '@shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props): React.JSX.Element {
  return (
    <Box className="flex-1 bg-background px-6 pb-8 pt-16">
      <VStack className="flex-1 justify-between" space="xl">
        <VStack space="xl">
          <HStack className="justify-between">
            <Badge tone="primary">
              <BadgeText tone="primary">Suporte remoto</BadgeText>
            </Badge>
            <Badge tone="success">
              <BadgeText tone="success">Tempo real</BadgeText>
            </Badge>
          </HStack>

          <VStack space="md">
            <Text className="text-4xl leading-tight" weight="bold">
              Remote Support
            </Text>
            <Text className="max-w-[320px] leading-6" tone="muted">
              Conecte atendente e cliente em uma sessão segura com chat,
              screenshot e comandos remotos.
            </Text>
          </VStack>
        </VStack>

        <VStack space="lg">
          <Box className="rounded-panel border border-border bg-surface p-5 shadow-soft">
            <VStack space="lg">
              <VStack space="xs">
                <Text size="sm" tone="muted" weight="semibold">
                  Escolha seu perfil
                </Text>
                <Text size="lg" weight="bold">
                  Como você quer iniciar?
                </Text>
              </VStack>

              <VStack space="md">
                <Button
                  className="justify-start"
                  size="lg"
                  onPress={() => navigation.navigate('Attendant')}
                >
                  <HStack className="w-full justify-between">
                    <HStack space="sm">
                      <Text size="xl">🛠️</Text>
                      <ButtonText size="md">Sou atendente</ButtonText>
                    </HStack>
                    <Text tone="inverse" weight="bold">
                      →
                    </Text>
                  </HStack>
                </Button>

                <Button
                  className="justify-start"
                  size="lg"
                  tone="success"
                  onPress={() => navigation.navigate('Client')}
                >
                  <HStack className="w-full justify-between">
                    <HStack space="sm">
                      <Text size="xl">👤</Text>
                      <ButtonText size="md" tone="success">
                        Sou cliente
                      </ButtonText>
                    </HStack>
                    <Text tone="inverse" weight="bold">
                      →
                    </Text>
                  </HStack>
                </Button>
              </VStack>
            </VStack>
          </Box>

          <Text className="text-center leading-5" size="sm" tone="muted">
            O atendente gera o código de sessão. O cliente usa esse código para
            entrar no atendimento.
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
