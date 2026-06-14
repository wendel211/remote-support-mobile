import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  generateSessionCode,
  createSession,
  listenToSession,
  endSession,
} from '@features/session/services';
import {
  setRole,
  setSession,
  setStatus,
  clearSession,
} from '@features/session/store';
import { clearMessages } from '@features/chat/store';
import type { Session, SessionStatus } from '@features/session/types';
import { StatusBadge } from '@shared/components';
import { ChatScreen } from '@features/chat/components';
import {
  requestScreenshot,
  listenToScreenshotRequest,
  clearScreenshotRequest,
  setLastScreenshot,
  setIsSending,
  setError,
  clearScreenshot,
  setPendingRequest,
  ScreenshotButton,
  ScreenshotViewer,
} from '@features/screenshot';
import {
  sendCommand,
  addSentCommand,
  CommandPicker,
  listenToPendingCommand,
  acknowledgeCommand,
} from '@features/commands';
import type { Command } from '@features/commands';
import { Box, Button, ButtonText, HStack, Text, VStack } from '@shared/ui';

import { usePerformanceMonitor, useRenderMetric } from '@features/performance';

type Props = NativeStackScreenProps<RootStackParamList, 'Attendant'>;

export function AttendantScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [currentStatus, setCurrentStatus] = useState<SessionStatus>('idle');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  usePerformanceMonitor(currentStatus === 'connected' ? sessionCode : '');
  useRenderMetric('AttendantScreen');

  const lastScreenshot = useAppSelector(
    (state) => state.screenshot.lastScreenshot,
  );
  const isSending = useAppSelector((state) => state.screenshot.isSending);
  const sentCommands = useAppSelector(
    (state) => state.commands.sentCommands,
  );

  const handleRequestScreenshot = useCallback(async () => {
    dispatch(setIsSending(true));
    dispatch(setError(null));
    try {
      await requestScreenshot(sessionCode);
    } catch (err: unknown) {
      dispatch(setIsSending(false));
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao solicitar screenshot';
      dispatch(setError(errorMessage));
    }
  }, [sessionCode, dispatch]);

  useEffect(() => {
    if (currentStatus !== 'connected' || !sessionCode) {
      return undefined;
    }

    const unsub = listenToScreenshotRequest(sessionCode, (request) => {
      dispatch(setPendingRequest(request));
      if (request && request.sentAt !== null) {
        dispatch(setLastScreenshot(request.base64));
        dispatch(setIsSending(false));
        void clearScreenshotRequest(sessionCode);
      }
    });

    return () => {
      unsub();
    };
  }, [currentStatus, sessionCode, dispatch]);

  useEffect(() => {
    if (currentStatus !== 'connected' || !sessionCode) {
      return undefined;
    }

    const unsubscribeCommands = listenToPendingCommand(
      sessionCode,
      (command) => {
        if (command) {
          const isSentByMe = sentCommands.some((c) => c.id === command.id);
          if (!isSentByMe) {
            if (command.type === 'NAVIGATE_URL' && command.payload?.url) {
              navigation.navigate('WebView', {
                url: command.payload.url,
              });
              void acknowledgeCommand(sessionCode, command.id);
            }
          }
        }
      },
    );

    return () => {
      unsubscribeCommands();
    };
  }, [currentStatus, sessionCode, sentCommands, navigation]);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    setInitError(null);
    const code = generateSessionCode();
    setSessionCode(code);

    try {
      await createSession(code);

      dispatch(setRole('attendant'));
      dispatch(
        setSession({
          code,
          status: 'waiting',
          role: 'attendant',
          attendantConnected: true,
          clientConnected: false,
          createdAt: Date.now(),
        }),
      );
      dispatch(setStatus('waiting'));
      setCurrentStatus('waiting');

      unsubscribeRef.current = listenToSession(
        code,
        (session: Session | null) => {
          if (session) {
            dispatch(setSession(session));
            dispatch(setStatus(session.status));
            setCurrentStatus(session.status);
          }
        },
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar sessao.';
      setInitError(message);
      setCurrentStatus('idle');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void initSession();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [initSession]);

  const handleEndSession = useCallback(async () => {
    if (sessionCode) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      await endSession(sessionCode);
      dispatch(clearMessages());
      dispatch(clearSession());
      dispatch(clearScreenshot());
      navigation.navigate('RoleSelection');
    }
  }, [sessionCode, dispatch, navigation]);

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-[#F3F4F6] px-8">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-[14px] text-[#64748B]">
          Criando sessao...
        </Text>
      </Box>
    );
  }

  if (initError) {
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
            <Box className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <MaterialCommunityIcons name="database-alert" size={36} color="#DC2626" />
            </Box>
            <VStack className="items-center" space="xs">
              <Text className="text-[25px] leading-[30px] text-black" weight="bold">
                Nao foi possivel criar a sessao
              </Text>
              <Text className="max-w-[270px] text-center text-[13px] leading-[19px] text-[#64748B]">
                {initError}
              </Text>
            </VStack>
          </VStack>

          <VStack space="md">
            <Button className="min-h-12" onPress={() => void initSession()}>
              <ButtonText>Tentar novamente</ButtonText>
            </Button>

            <Button
              className="min-h-12"
              variant="outline"
              tone="secondary"
              onPress={() => navigation.navigate('RoleSelection')}
            >
              <ButtonText variant="outline" tone="secondary">
                Voltar
              </ButtonText>
            </Button>
          </VStack>
        </VStack>
      </Box>
    );
  }

  if (currentStatus === 'connected') {
    return (
      <Box className="flex-1 bg-[#F3F4F6]">
        <VStack
          className="bg-[#F3F4F6] px-4 pb-3"
          style={{ paddingTop: Math.max(insets.top, 24) + 10 }}
          space="sm"
        >
          <HStack className="items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <HStack className="items-center" space="sm">
              <Box className="h-11 w-11 items-center justify-center rounded-xl bg-[#F1F5F9]">
                <AttendantIcon />
              </Box>
              <VStack space="xs">
                <Text className="text-[16px] leading-[19px] text-[#0F172A]" weight="bold">
                  Atendente
                </Text>
                <Text className="text-[11px] leading-[13px] text-[#64748B]">
                  Sessao ativa
                </Text>
              </VStack>
            </HStack>
            <VStack className="items-end" space="xs">
              <Box className="rounded-md bg-[#EAF2FF] px-2.5 py-1">
                <Text className="text-[12px] leading-4 text-[#2563EB]" weight="bold">
                  {sessionCode}
                </Text>
              </Box>
              <StatusBadge status={currentStatus} />
            </VStack>
          </HStack>

          <HStack className="justify-center rounded-xl bg-[#ECFDF5] py-2" space="sm">
            <ConnectedIcon />
            <Text className="text-[12px] leading-4 text-[#059669]" weight="semibold">
              Cliente conectado
            </Text>
          </HStack>
        </VStack>

        <Box className="border-y border-[#E2E8F0] bg-white px-4 py-3">
          <ScreenshotButton
            onPress={() => void handleRequestScreenshot()}
            isLoading={isSending}
          />
        </Box>

        <CommandPicker
          sessionCode={sessionCode}
          onSend={(cmd) => {
            void (async () => {
              const id = await sendCommand(sessionCode, cmd);
              dispatch(
                addSentCommand({
                  ...cmd,
                  id,
                  sentAt: Date.now(),
                  acknowledgedAt: null,
                } as Command),
              );
            })();
          }}
        />

        <ChatScreen sessionCode={sessionCode} currentRole="attendant" />

        <Box className="bg-white px-4 py-3">
          <Button
            className="min-h-12"
            tone="danger"
            onPress={() => void handleEndSession()}
          >
            <ButtonText tone="danger">Encerrar sessao</ButtonText>
          </Button>
        </Box>

        <ScreenshotViewer
          base64={lastScreenshot}
          onClose={() => dispatch(setLastScreenshot(null))}
        />
      </Box>
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
          <Box className="h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9]">
            <AttendantIcon large />
          </Box>
          <VStack className="items-center" space="xs">
            <Text className="text-[25px] leading-[30px] text-black" weight="bold">
              Painel do atendente
            </Text>
            <Text className="max-w-[250px] text-center text-[13px] leading-[19px] text-[#64748B]">
              Compartilhe o codigo abaixo e aguarde o cliente autorizar a
              conexao.
            </Text>
          </VStack>
        </VStack>

        <Box className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-6 shadow-sm">
          <VStack className="items-center" space="md">
            <Text className="text-[12px] leading-4 text-[#64748B]" weight="semibold">
              Codigo da sessao
            </Text>
            <Text className="text-[38px] leading-[44px] tracking-[7px] text-[#2563EB]" weight="bold">
              {sessionCode}
            </Text>
            <Text className="text-center text-[12px] leading-[17px] text-[#64748B]">
              O cliente usa este codigo para entrar no atendimento.
            </Text>
          </VStack>
        </Box>

        <VStack space="md">
          <StatusBadge status={currentStatus} />

          {currentStatus === 'ended' && (
            <HStack
              className="justify-center rounded-xl border border-red-100 bg-danger-50 px-5 py-3"
              space="sm"
            >
              <Text className="text-[13px] text-danger-600" weight="semibold">
                Sessao encerrada
              </Text>
            </HStack>
          )}

          <Button
            className="min-h-12"
            tone="danger"
            onPress={() => void handleEndSession()}
          >
            <ButtonText tone="danger">Encerrar sessao</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}

function AttendantIcon({ large = false }: { large?: boolean }): React.JSX.Element {
  return (
    <MaterialCommunityIcons name="tools" size={large ? 36 : 27} color="#475569" />
  );
}

function ConnectedIcon(): React.JSX.Element {
  return (
    <Box className="h-[14px] w-[14px] items-center justify-center rounded-full bg-[#059669]">
      <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
    </Box>
  );
}
