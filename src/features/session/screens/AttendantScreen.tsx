import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
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
import { sendMessage } from '@features/chat';
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const prevStatusRef = useRef<SessionStatus>('idle');

  const currentStatusRef = useRef<SessionStatus>('idle');
  const sessionCodeRef = useRef('');

  useEffect(() => {
    currentStatusRef.current = currentStatus;
    sessionCodeRef.current = sessionCode;
  }, [currentStatus, sessionCode]);

  usePerformanceMonitor(currentStatus === 'connected' ? sessionCode : '');
  useRenderMetric('AttendantScreen');

  const lastScreenshot = useAppSelector(
    (state) => state.screenshot.lastScreenshot,
  );
  const isSending = useAppSelector((state) => state.screenshot.isSending);
  const screenshotError = useAppSelector((state) => state.screenshot.error);
  const sentCommands = useAppSelector(
    (state) => state.commands.sentCommands,
  );

  const handleRequestScreenshot = useCallback(async () => {
    console.log('[ATTENDANT] handleRequestScreenshot chamado. sessionCode:', sessionCode);
    dispatch(setIsSending(true));
    dispatch(setError(null));
    try {
      await requestScreenshot(sessionCode);
      console.log('[ATTENDANT] requestScreenshot gravado com sucesso no Firebase.');
      await sendMessage(sessionCode, {
        sessionCode,
        text: 'Captura de tela solicitada pelo atendente.',
        role: 'system',
        status: 'sent',
        timestamp: Date.now(),
      });
    } catch (err: unknown) {
      dispatch(setIsSending(false));
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao solicitar screenshot';
      console.error('[ATTENDANT] Erro ao gravar requestScreenshot:', errorMessage);
      dispatch(setError(errorMessage));
    }
  }, [sessionCode, dispatch]);

  useEffect(() => {
    if (currentStatus !== 'connected' || !sessionCode) {
      console.log('[ATTENDANT] listenToScreenshotRequest desativado. Status:', currentStatus, 'Code:', sessionCode);
      return undefined;
    }

    console.log('[ATTENDANT] Ativando listenToScreenshotRequest para:', sessionCode);
    const unsub = listenToScreenshotRequest(sessionCode, (request) => {
      console.log('[ATTENDANT] listenToScreenshotRequest detectou mudanca:', request);
      dispatch(setPendingRequest(request));

      if (request?.error) {
        console.log('[ATTENDANT] Request retornou erro do cliente:', request.error);
        dispatch(setError(request.error));
        dispatch(setIsSending(false));
        void clearScreenshotRequest(sessionCode);
        return;
      }

      if (request && request.sentAt !== null && request.base64) {
        console.log('[ATTENDANT] Screenshot recebida com sucesso! Tamanho:', request.base64.length);
        dispatch(setLastScreenshot(request.base64));
        dispatch(setIsSending(false));
        void clearScreenshotRequest(sessionCode);
      }
    });

    return () => {
      console.log('[ATTENDANT] Desinscrevendo do listenToScreenshotRequest.');
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
      dispatch(clearScreenshot());
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
            if (
              session.status === 'connected' &&
              prevStatusRef.current !== 'connected'
            ) {
              dispatch(clearScreenshot());
            }
            prevStatusRef.current = session.status;
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
        unsubscribeRef.current = null;
      }
      // Encerrar a sessão no Firebase ao desmontar o componente usando os refs atualizados
      if (
        sessionCodeRef.current &&
        currentStatusRef.current !== 'idle' &&
        currentStatusRef.current !== 'ended'
      ) {
        void endSession(sessionCodeRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initSession]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Box className="flex-1 bg-[#F3F4F6]">
          <VStack
            className="bg-[#F3F4F6] px-4 pb-3"
            style={{ paddingTop: Math.max(insets.top, 24) + 10 }}
            space="sm"
          >
            <HStack className="items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
              <HStack className="items-center flex-1" space="md">
                <Box className="h-10 w-10 items-center justify-center rounded-xl bg-[#F1F5F9]">
                  <AttendantIcon size={22} />
                </Box>
                <Text className="text-[17px] text-[#0F172A]" weight="bold">
                  Atendente
                </Text>
                <Box className="rounded-md bg-[#F1F5F9] px-2 py-0.5">
                  <Text className="text-[12px] leading-4 text-[#64748B]" weight="bold">
                    #{sessionCode}
                  </Text>
                </Box>
                <StatusBadge status={currentStatus} />
              </HStack>
            </HStack>
  
            <HStack className="justify-center rounded-xl bg-[#ECFDF5] py-2" space="xs">
              <ConnectedIcon />
              <Text className="text-[12px] leading-4 text-[#059669]" weight="semibold">
                Cliente conectado com sucesso
              </Text>
            </HStack>
          </VStack>

        {!isKeyboardVisible && (
          <>
            <Box className="border-y border-[#E2E8F0] bg-white px-4 py-3">
              <ScreenshotButton
                onPress={() => void handleRequestScreenshot()}
                isLoading={isSending}
              />
              {screenshotError ? (
                <Box className="mt-3 rounded-xl border border-red-100 bg-danger-50 px-4 py-3">
                  <Text className="text-center text-[12px]" tone="danger" weight="medium">
                    {screenshotError}
                  </Text>
                </Box>
              ) : null}
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
          </>
        )}

        <ChatScreen sessionCode={sessionCode} currentRole="attendant" />

        {!isKeyboardVisible && (
          <Box 
            className="bg-white px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <Button
              className="min-h-12 w-full"
              tone="danger"
              onPress={() => void handleEndSession()}
            >
              <HStack className="items-center justify-center" space="sm">
                <MaterialCommunityIcons name="power" size={18} color="#FFFFFF" />
                <ButtonText tone="danger">Encerrar sessão</ButtonText>
              </HStack>
            </Button>
          </Box>
        )}

        <ScreenshotViewer
          base64={lastScreenshot}
          onClose={() => dispatch(setLastScreenshot(null))}
        />
      </Box>
    </KeyboardAvoidingView>
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

function AttendantIcon({ large = false, size }: { large?: boolean; size?: number }): React.JSX.Element {
  return (
    <MaterialCommunityIcons name="tools" size={size ?? (large ? 36 : 22)} color="#475569" />
  );
}

function ConnectedIcon(): React.JSX.Element {
  return (
    <Box className="h-[14px] w-[14px] items-center justify-center rounded-full bg-[#059669]">
      <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
    </Box>
  );
}
