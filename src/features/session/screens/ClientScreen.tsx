import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  joinSession,
  listenToSession,
  endSession,
} from '@features/session/services';
import {
  setRole,
  setSession,
  setError,
  clearSession,
} from '@features/session/store';
import { clearMessages } from '@features/chat/store';
import type { Session } from '@features/session/types';
import { StatusBadge } from '@shared/components';
import { ChatScreen } from '@features/chat/components';
import ViewShot from 'react-native-view-shot';
import { useScreenshotCapture } from '@features/screenshot';
import {
  listenToPendingCommand,
  acknowledgeCommand,
  setPendingCommand,
  CommandModal,
} from '@features/commands';

import { usePerformanceMonitor, useRenderMetric } from '@features/performance';
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Input,
  Text,
  VStack,
} from '@shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Client'>;

export function ClientScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.session.error);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedCode, setConnectedCode] = useState('');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  usePerformanceMonitor(isConnected ? connectedCode : '');
  useRenderMetric('ClientScreen');

  const pendingCommand = useAppSelector(
    (state) => state.commands.pendingCommand,
  );

  const { captureRef, isSending } = useScreenshotCapture(connectedCode);

  const handleJoinSession = useCallback(async () => {
    if (code.length !== 6) {
      dispatch(setError('O código deve ter 6 caracteres.'));
      return;
    }

    setIsLoading(true);
    dispatch(setError(null));

    try {
      const session = await joinSession(code);
      dispatch(setRole('client'));
      dispatch(setSession(session));
      setIsConnected(true);
      setConnectedCode(code);

      unsubscribeRef.current = listenToSession(
        code,
        (updatedSession: Session | null) => {
          if (!updatedSession || updatedSession.status === 'ended') {
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }
            dispatch(clearMessages());
            dispatch(clearSession());
            navigation.navigate('RoleSelection');
          } else {
            dispatch(setSession(updatedSession));
          }
        },
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao entrar na sessão.';
      dispatch(setError(message));
    } finally {
      setIsLoading(false);
    }
  }, [code, dispatch, navigation]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (!connectedCode) {
      return undefined;
    }

    const unsubscribeCommands = listenToPendingCommand(
      connectedCode,
      (command) => {
        dispatch(setPendingCommand(command));
      },
    );

    return () => {
      unsubscribeCommands();
    };
  }, [connectedCode, dispatch]);

  const handleLeaveSession = useCallback(async () => {
    if (connectedCode) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      await endSession(connectedCode);
      dispatch(clearMessages());
      dispatch(clearSession());
      navigation.navigate('RoleSelection');
    }
  }, [connectedCode, dispatch, navigation]);

  const handleCodeChange = useCallback((text: string) => {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  }, []);

  if (isConnected) {
    return (
      <ViewShot ref={captureRef} style={{ flex: 1 }}>
        <Box className="flex-1 bg-background">
          <HStack className="justify-between border-b border-border bg-surface px-4 pb-3 pt-14">
            <HStack space="sm">
              <Text size="lg" weight="bold">
                👤 Cliente
              </Text>
              <Box className="rounded-ui bg-primary-50 px-3 py-1">
                <Text size="sm" tone="primary" weight="semibold">
                  {connectedCode}
                </Text>
              </Box>
            </HStack>
            <StatusBadge status="connected" />
          </HStack>

          {isSending && (
            <Box className="border-b border-orange-100 bg-warning-50 py-2">
              <Text
                className="text-center text-warning-500"
                size="xs"
                weight="semibold"
              >
                Enviando screenshot...
              </Text>
            </Box>
          )}

          <HStack className="justify-center bg-accent-50 py-1.5" space="sm">
            <Text size="sm">✅</Text>
            <Text className="text-accent-600" size="sm" weight="semibold">
              Conectado ao atendente
            </Text>
          </HStack>

          <ChatScreen sessionCode={connectedCode} currentRole="client" />

          <Button
            className="mx-4 my-2 min-h-11"
            tone="danger"
            onPress={() => void handleLeaveSession()}
          >
            <ButtonText tone="danger">Sair da sessão</ButtonText>
          </Button>

          <CommandModal
            command={pendingCommand}
            onAcknowledge={() => {
              if (pendingCommand) {
                void acknowledgeCommand(connectedCode, pendingCommand.id);
                if (
                  pendingCommand.type === 'NAVIGATE_URL' &&
                  pendingCommand.payload?.url
                ) {
                  navigation.navigate('WebView', {
                    url: pendingCommand.payload.url,
                  });
                }
                dispatch(setPendingCommand(null));
              }
            }}
          />
        </Box>
      </ViewShot>
    );
  }

  return (
    <Box className="flex-1 justify-center bg-background px-6">
      <VStack space="xl">
        <VStack className="items-center" space="sm">
          <Text className="text-5xl">👤</Text>
          <Text size="2xl" weight="bold">
            Entrar na sessão
          </Text>
          <Text className="text-center leading-5" size="sm" tone="muted">
            Digite o código de 6 caracteres fornecido pelo atendente.
          </Text>
        </VStack>

        <Box className="rounded-panel border border-border bg-surface p-5 shadow-soft">
          <VStack space="md">
            <Input
              className="min-h-16 text-center text-2xl font-bold tracking-[8px]"
              value={code}
              onChangeText={handleCodeChange}
              placeholder="CÓDIGO"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />

            {error ? (
              <Box className="rounded-ui border border-red-100 bg-danger-50 px-4 py-3">
                <Text className="text-center" size="sm" tone="danger" weight="medium">
                  {error}
                </Text>
              </Box>
            ) : null}

            <Button
              isLoading={isLoading}
              disabled={isLoading || code.length !== 6}
              onPress={() => void handleJoinSession()}
            >
              <ButtonText>Entrar na sessão</ButtonText>
            </Button>

            <Button
              disabled={isLoading}
              variant="outline"
              tone="secondary"
              onPress={() => navigation.navigate('RoleSelection')}
            >
              {isLoading ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <ButtonText variant="outline" tone="secondary">
                  Voltar
                </ButtonText>
              )}
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
