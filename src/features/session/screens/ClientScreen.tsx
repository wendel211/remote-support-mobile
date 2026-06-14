import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
      dispatch(setError('O codigo deve ter 6 caracteres.'));
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
        err instanceof Error ? err.message : 'Erro ao entrar na sessao.';
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
        <Box className="flex-1 bg-[#F3F4F6]">
          <VStack
            className="bg-[#F3F4F6] px-4 pb-3"
            style={{ paddingTop: Math.max(insets.top, 24) + 10 }}
            space="sm"
          >
            <HStack className="items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
              <HStack className="items-center" space="sm">
                <Box className="h-11 w-11 items-center justify-center rounded-xl bg-[#F8FAFC]">
                  <ClientIcon />
                </Box>
                <VStack space="xs">
                  <Text className="text-[16px] leading-[19px] text-[#0F172A]" weight="bold">
                    Cliente
                  </Text>
                  <Text className="text-[11px] leading-[13px] text-[#64748B]">
                    Sessao ativa
                  </Text>
                </VStack>
              </HStack>
              <VStack className="items-end" space="xs">
                <Box className="rounded-md bg-[#EAF2FF] px-2.5 py-1">
                  <Text className="text-[12px] leading-4 text-[#2563EB]" weight="bold">
                    {connectedCode}
                  </Text>
                </Box>
                <StatusBadge status="connected" />
              </VStack>
            </HStack>

            {isSending && (
              <Box className="rounded-xl border border-orange-100 bg-warning-50 py-2">
                <Text
                  className="text-center text-[12px] text-warning-500"
                  weight="semibold"
                >
                  Enviando screenshot...
                </Text>
              </Box>
            )}

            <HStack className="justify-center rounded-xl bg-[#ECFDF5] py-2" space="sm">
              <ConnectedIcon />
              <Text className="text-[12px] leading-4 text-[#059669]" weight="semibold">
                Conectado ao atendente
              </Text>
            </HStack>
          </VStack>

          <ChatScreen sessionCode={connectedCode} currentRole="client" />

          <Box className="bg-white px-4 py-3">
            <Button
              className="min-h-12"
              tone="danger"
              onPress={() => void handleLeaveSession()}
            >
              <ButtonText tone="danger">Sair da sessao</ButtonText>
            </Button>
          </Box>

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
    <Box
      className="flex-1 bg-[#F3F4F6] px-7"
      style={{
        paddingTop: Math.max(insets.top, 24) + 16,
        paddingBottom: Math.max(insets.bottom, 20),
      }}
    >
      <VStack className="flex-1 justify-center" space="xl">
        <VStack className="items-center" space="md">
          <Box className="h-16 w-16 items-center justify-center rounded-2xl bg-[#F8FAFC]">
            <ClientIcon large />
          </Box>
          <VStack className="items-center" space="xs">
            <Text className="text-[25px] leading-[30px] text-black" weight="bold">
              Entrar na sessao
            </Text>
            <Text className="max-w-[255px] text-center text-[13px] leading-[19px] text-[#64748B]">
              Digite o codigo de 6 caracteres fornecido pelo atendente.
            </Text>
          </VStack>
        </VStack>

        <Box className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <VStack space="md">
            <Input
              className="min-h-[66px] text-center text-[25px] font-bold tracking-[8px]"
              value={code}
              onChangeText={handleCodeChange}
              placeholder="CODIGO"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />

            {error ? (
              <Box className="rounded-xl border border-red-100 bg-danger-50 px-4 py-3">
                <Text className="text-center text-[13px]" tone="danger" weight="medium">
                  {error}
                </Text>
              </Box>
            ) : null}

            <Button
              className="min-h-12"
              isLoading={isLoading}
              disabled={isLoading || code.length !== 6}
              onPress={() => void handleJoinSession()}
            >
              <ButtonText>Entrar na sessao</ButtonText>
            </Button>

            <Button
              className="min-h-12"
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

function ClientIcon({ large = false }: { large?: boolean }): React.JSX.Element {
  const scale = large ? 1.25 : 1;
  return (
    <Box style={{ height: 28 * scale, width: 28 * scale, alignItems: 'center' }}>
      <Box
        className="rounded-full bg-[#374151]"
        style={{
          marginTop: 5 * scale,
          height: 9 * scale,
          width: 9 * scale,
        }}
      />
      <Box
        className="rounded-t-full bg-[#374151]"
        style={{
          marginTop: 2 * scale,
          height: 9 * scale,
          width: 16 * scale,
        }}
      />
    </Box>
  );
}

function ConnectedIcon(): React.JSX.Element {
  return (
    <Box className="h-[14px] w-[14px] items-center justify-center rounded-full bg-[#059669]">
      <Text className="text-[9px] leading-[11px] text-white" weight="bold">
        OK
      </Text>
    </Box>
  );
}
