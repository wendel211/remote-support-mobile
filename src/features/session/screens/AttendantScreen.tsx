import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(true);
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
      <Box className="flex-1 items-center justify-center bg-background px-8">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4" tone="muted">
          Criando sessão...
        </Text>
      </Box>
    );
  }

  if (currentStatus === 'connected') {
    return (
      <Box className="flex-1 bg-background">
        <HStack className="justify-between border-b border-border bg-surface px-4 pb-3 pt-14">
          <HStack space="sm">
            <Text size="lg" weight="bold">
              🛠️ Atendente
            </Text>
            <Box className="rounded-ui bg-primary-50 px-3 py-1">
              <Text size="sm" tone="primary" weight="semibold">
                {sessionCode}
              </Text>
            </Box>
          </HStack>
          <StatusBadge status={currentStatus} />
        </HStack>

        <HStack className="justify-center bg-accent-50 py-1.5" space="sm">
          <Text size="sm">✅</Text>
          <Text className="text-accent-600" size="sm" weight="semibold">
            Cliente conectado
          </Text>
        </HStack>

        <Box className="border-b border-border bg-surface px-4 py-2.5">
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

        <Button
          className="mx-4 my-2 min-h-11"
          tone="danger"
          onPress={() => void handleEndSession()}
        >
          <ButtonText tone="danger">Encerrar sessão</ButtonText>
        </Button>

        <ScreenshotViewer
          base64={lastScreenshot}
          onClose={() => dispatch(setLastScreenshot(null))}
        />
      </Box>
    );
  }

  return (
    <Box className="flex-1 justify-center bg-background px-6">
      <VStack space="xl">
        <VStack className="items-center" space="sm">
          <Text className="text-5xl">🛠️</Text>
          <Text size="2xl" weight="bold">
            Painel do Atendente
          </Text>
          <Text className="text-center leading-5" size="sm" tone="muted">
            Gere uma sessão e aguarde o cliente entrar pelo código.
          </Text>
        </VStack>

        <Box className="rounded-panel border border-border bg-surface px-5 py-6 shadow-soft">
          <VStack className="items-center" space="sm">
            <Text size="sm" tone="muted" weight="medium">
              Código da sessão
            </Text>
            <Text className="text-4xl tracking-[6px]" tone="primary" weight="bold">
              {sessionCode}
            </Text>
            <Text size="xs" tone="muted">
              Compartilhe este código com o cliente
            </Text>
          </VStack>
        </Box>

        <StatusBadge status={currentStatus} />

        {currentStatus === 'ended' && (
          <HStack
            className="justify-center rounded-ui border border-red-100 bg-danger-50 px-5 py-3"
            space="sm"
          >
            <Text>🔴</Text>
            <Text tone="danger" weight="semibold">
              Sessão encerrada
            </Text>
          </HStack>
        )}

        <Button tone="danger" onPress={() => void handleEndSession()}>
          <ButtonText tone="danger">Encerrar sessão</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
