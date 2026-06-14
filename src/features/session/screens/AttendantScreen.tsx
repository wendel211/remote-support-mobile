import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  generateSessionCode,
  createSession,
  registerAttendantPresence,
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
} from '@features/commands';
import type { Command } from '@features/commands';
import { Box, Button, ButtonText, HStack, Input, Text, VStack, useTheme } from '@shared/ui';

import { usePerformanceMonitor, useRenderMetric } from '@features/performance';

type Props = NativeStackScreenProps<RootStackParamList, 'Attendant'>;

export function AttendantScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [currentStatus, setCurrentStatus] = useState<SessionStatus>('idle');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [supportUrl, setSupportUrl] = useState('https://support.google.com');
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
  const handleRequestScreenshot = useCallback(async () => {
    dispatch(setIsSending(true));
    dispatch(setError(null));
    try {
      await requestScreenshot(sessionCode);
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
        err instanceof Error ? err.message : 'Erro ao solicitar a captura de tela.';
      dispatch(setError(errorMessage));
    }
  }, [sessionCode, dispatch]);

  useEffect(() => {
    if (currentStatus !== 'connected' || !sessionCode) {
      return undefined;
    }

    const unsub = listenToScreenshotRequest(sessionCode, (request) => {
      dispatch(setPendingRequest(request));

      if (request?.error) {
        dispatch(setError(request.error));
        dispatch(setIsSending(false));
        void clearScreenshotRequest(sessionCode);
        return;
      }

      if (request && request.sentAt != null && request.base64) {
        dispatch(setLastScreenshot(request.base64));
        dispatch(setIsSending(false));
        void clearScreenshotRequest(sessionCode);
      }
    });

    return () => {
      unsub();
    };
  }, [currentStatus, sessionCode, dispatch]);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    setInitError(null);
    const code = generateSessionCode();
    setSessionCode(code);

    try {
      dispatch(clearScreenshot());
      await createSession(code);
      await registerAttendantPresence(code);

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
        err instanceof Error ? err.message : 'Erro ao criar a sessão.';
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
      // Encerra a sessão no Firebase ao desmontar o componente usando os refs atualizados.
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

  const handleOpenSupportUrl = useCallback(() => {
    const trimmedUrl = supportUrl.trim();
    if (!trimmedUrl) {
      return;
    }

    const url = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    navigation.navigate('WebView', {
      url,
      title: 'Suporte',
    });
  }, [navigation, supportUrl]);

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center px-8" style={{ backgroundColor: isDark ? '#090D16' : '#F3F4F6' }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#2563EB'} />
        <Text className="mt-4 text-[14px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
          Criando sessão...
        </Text>
      </Box>
    );
  }

  if (initError) {
    return (
      <Box
        className="flex-1 px-7"
        style={{
          backgroundColor: isDark ? '#090D16' : '#F3F4F6',
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 20),
        }}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <VStack className="flex-1 justify-center" space="xl">
          <VStack className="items-center" space="md">
            <Box
              className="h-16 w-16 items-center justify-center rounded-2xl border"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                borderColor: isDark ? '#7F1D1D' : '#FCA5A5',
                borderWidth: 1
              }}
            >
              <MaterialCommunityIcons name="database-alert" size={36} color={isDark ? '#EF4444' : '#DC2626'} />
            </Box>
            <VStack className="items-center" space="xs">
              <Text className="text-[25px] leading-[30px]" style={{ color: isDark ? '#FFFFFF' : '#111827' }} weight="bold">
                Não foi possível criar a sessão
              </Text>
              <Text className="max-w-[270px] text-center text-[13px] leading-[19px]" style={{ color: isDark ? '#F87171' : '#64748B' }}>
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
              style={{
                backgroundColor: 'transparent',
                borderColor: isDark ? '#24334A' : '#D7DEE8'
              }}
              onPress={() => navigation.navigate('RoleSelection')}
            >
              <ButtonText variant="outline" tone="secondary" style={{ color: isDark ? '#94A3B8' : '#475569' }}>
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
        <Box className="flex-1" style={{ backgroundColor: isDark ? '#090D16' : '#F3F4F6' }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <VStack
            className="px-4 pb-3"
            style={{ backgroundColor: isDark ? '#090D16' : '#F3F4F6', paddingTop: Math.max(insets.top, 24) + 10 }}
            space="sm"
          >
            <HStack
              className="items-center justify-between rounded-2xl border px-4 py-3 shadow-sm"
              style={{
                backgroundColor: isDark ? '#161F30' : '#FFFFFF',
                borderColor: isDark ? '#24334A' : '#E2E8F0'
              }}
            >
              <HStack className="items-center flex-1" space="md">
                <Box className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }}>
                  <AttendantIcon size={22} />
                </Box>
                <Text className="text-[17px]" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }} weight="bold">
                  Atendente
                </Text>
                <Box className="rounded-md px-2 py-0.5" style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }}>
                  <Text className="text-[12px] leading-4" style={{ color: isDark ? '#94A3B8' : '#64748B' }} weight="bold">
                    #{sessionCode}
                  </Text>
                </Box>
                <StatusBadge status={currentStatus} />
              </HStack>
            </HStack>

            <HStack className="justify-center rounded-xl py-2" style={{ backgroundColor: isDark ? 'rgba(5, 150, 105, 0.1)' : '#ECFDF5' }} space="xs">
              <ConnectedIcon />
              <Text className="text-[12px] leading-4" style={{ color: isDark ? '#34D399' : '#059669' }} weight="semibold">
                Cliente conectado com sucesso
              </Text>
            </HStack>
          </VStack>

          {!isKeyboardVisible && (
            <>
              <Box
                className="px-4 py-3"
                style={{
                  backgroundColor: isDark ? '#161F30' : '#FFFFFF',
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: isDark ? '#24334A' : '#E2E8F0'
                }}
              >
                <ScreenshotButton
                  onPress={() => void handleRequestScreenshot()}
                  isLoading={isSending}
                />
                {screenshotError ? (
                  <Box
                    className="mt-3 rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                      borderColor: isDark ? '#7F1D1D' : '#FCA5A5'
                    }}
                  >
                    <Text className="text-center text-[12px]" tone="danger" weight="medium">
                      {screenshotError}
                    </Text>
                  </Box>
                ) : null}
              </Box>

              <Box
                className="px-4 py-3"
                style={{
                  backgroundColor: isDark ? '#161F30' : '#FFFFFF',
                  borderBottomWidth: 1,
                  borderColor: isDark ? '#24334A' : '#E2E8F0'
                }}
              >
                <VStack space="sm">
                  <HStack className="items-center justify-between">
                    <Text className="text-[12px] uppercase tracking-[1px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }} weight="bold">
                      WebView do atendente
                    </Text>
                    <Text className="text-[12px]" style={{ color: isDark ? '#64748B' : '#64748B' }}>
                      Local
                    </Text>
                  </HStack>

                  <HStack className="items-center" space="sm">
                    <Input
                      className="flex-1"
                      value={supportUrl}
                      onChangeText={setSupportUrl}
                      placeholder="https://exemplo.com"
                      placeholderTextColor={isDark ? '#475569' : '#98A2B3'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      style={isDark ? { backgroundColor: '#090D16', borderColor: '#24334A', color: '#FFFFFF' } : undefined}
                    />
                    <Button
                      className="min-h-11 px-4"
                      disabled={supportUrl.trim().length === 0}
                      onPress={handleOpenSupportUrl}
                    >
                      <HStack className="items-center justify-center" space="xs">
                        <MaterialCommunityIcons name="open-in-app" size={17} color="#FFFFFF" />
                        <ButtonText size="sm">Abrir</ButtonText>
                      </HStack>
                    </Button>
                  </HStack>
                </VStack>
              </Box>

            </>
          )}

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

          {!isKeyboardVisible && (
            <Box
              className="px-4 pt-3"
              style={{
                backgroundColor: isDark ? '#161F30' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom, 12)
              }}
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
      className="flex-1 px-7"
      style={{
        backgroundColor: isDark ? '#090D16' : '#F3F4F6',
        paddingTop: Math.max(insets.top, 24) + 16,
        paddingBottom: Math.max(insets.bottom, 20),
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <VStack className="flex-1 justify-center" space="xl">
        <VStack className="items-center" space="md">
          <Box className="h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }}>
            <AttendantIcon large />
          </Box>
          <VStack className="items-center" space="xs">
            <Text className="text-[25px] leading-[30px]" style={{ color: isDark ? '#FFFFFF' : '#111827' }} weight="bold">
              Painel do atendente
            </Text>
            <Text className="max-w-[250px] text-center text-[13px] leading-[19px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              O cliente usa este código para entrar no atendimento.
            </Text>
          </VStack>
        </VStack>

        <Box
          className="rounded-2xl border px-5 py-6 shadow-sm"
          style={{
            backgroundColor: isDark ? '#161F30' : '#FFFFFF',
            borderColor: isDark ? '#24334A' : '#E2E8F0'
          }}
        >
          <VStack className="items-center" space="md">
            <Text className="text-[12px] leading-4" style={{ color: isDark ? '#94A3B8' : '#64748B' }} weight="semibold">
              Código da sessão
            </Text>
            <Text className="text-[38px] leading-[44px] tracking-[7px]" style={{ color: isDark ? '#60A5FA' : '#2563EB' }} weight="bold">
              {sessionCode}
            </Text>
            <Text className="text-center text-[12px] leading-[17px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              O cliente usa este código para entrar no atendimento.
            </Text>
          </VStack>
        </Box>

        <VStack space="md">
          <StatusBadge status={currentStatus} />

          {currentStatus === 'ended' && (
            <HStack
              className="justify-center rounded-xl border px-5 py-3"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                borderColor: isDark ? '#7F1D1D' : '#FCA5A5'
              }}
              space="sm"
            >
              <Text className="text-[13px]" style={{ color: isDark ? '#F87171' : '#DC2626' }} weight="semibold">
                Sessão encerrada
              </Text>
            </HStack>
          )}

          <Button
            className="min-h-12"
            tone="danger"
            onPress={() => void handleEndSession()}
          >
            <ButtonText tone="danger">Encerrar sessão</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}

function AttendantIcon({ large = false, size }: { large?: boolean; size?: number }): React.JSX.Element {
  const { isDark } = useTheme();
  return (
    <MaterialCommunityIcons name="tools" size={size ?? (large ? 36 : 22)} color={isDark ? '#94A3B8' : '#475569'} />
  );
}

function ConnectedIcon(): React.JSX.Element {
  return (
    <Box className="h-[14px] w-[14px] items-center justify-center rounded-full bg-[#059669]">
      <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
    </Box>
  );
}
