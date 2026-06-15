import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
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
import { NetworkStatusBanner, StatusBadge } from '@shared/components';
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
type AttendantTab = 'controls' | 'chat';

export function AttendantScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [currentStatus, setCurrentStatus] = useState<SessionStatus>('idle');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [supportUrl, setSupportUrl] = useState('https://support.google.com');
  const [activeTab, setActiveTab] = useState<AttendantTab>('controls');
  const [unreadClientMessages, setUnreadClientMessages] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const prevStatusRef = useRef<SessionStatus>('idle');
  const currentStatusRef = useRef<SessionStatus>('idle');
  const sessionCodeRef = useRef('');
  const lastSeenClientMessageCountRef = useRef(0);

  const entryAnim = useRef(new Animated.Value(0)).current;
  const connectedAnim = useRef(new Animated.Value(0)).current;
  const waitingPulse = useRef(new Animated.Value(0)).current;
  const copySuccessAnim = useRef(new Animated.Value(0)).current;
  const tabProgress = useRef(new Animated.Value(0)).current;
  const badgePulse = useRef(new Animated.Value(1)).current;

  const lastScreenshot = useAppSelector(
    (state) => state.screenshot.lastScreenshot,
  );
  const currentSession = useAppSelector((state) => state.session.session);
  const isSending = useAppSelector((state) => state.screenshot.isSending);
  const screenshotError = useAppSelector((state) => state.screenshot.error);
  const clientMessageCount = useAppSelector(
    (state) => state.chat.messages.filter((message) => message.role === 'client').length,
  );
  const isOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;
  const isWaitingForConnection =
    isOffline || (currentStatus === 'connected' && currentSession?.clientOnline === false);

  const tabContainerWidth = Math.max(width - 32, 280);
  const tabIndicatorWidth = (tabContainerWidth - 8) / 2;

  useEffect(() => {
    currentStatusRef.current = currentStatus;
    sessionCodeRef.current = sessionCode;
  }, [currentStatus, sessionCode]);

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [entryAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waitingPulse, {
          toValue: 1,
          duration: 950,
          useNativeDriver: true,
        }),
        Animated.timing(waitingPulse, {
          toValue: 0,
          duration: 950,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [waitingPulse]);

  useEffect(() => {
    Animated.spring(tabProgress, {
      toValue: activeTab === 'controls' ? 0 : 1,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabProgress]);

  useEffect(() => {
    if (currentStatus === 'connected') {
      connectedAnim.setValue(0);
      Animated.timing(connectedAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }).start();
    } else {
      connectedAnim.setValue(0);
    }
  }, [connectedAnim, currentStatus]);

  useEffect(() => {
    if (unreadClientMessages <= 0) {
      badgePulse.stopAnimation();
      badgePulse.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, {
          toValue: 0.55,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(badgePulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [badgePulse, unreadClientMessages]);

  useEffect(() => {
    if (activeTab === 'chat') {
      lastSeenClientMessageCountRef.current = clientMessageCount;
      setUnreadClientMessages(0);
      return;
    }

    const diff = clientMessageCount - lastSeenClientMessageCountRef.current;
    if (diff > 0) {
      setUnreadClientMessages(diff);
    }
  }, [activeTab, clientMessageCount]);

  useEffect(() => {
    if (lastScreenshot) {
      setPreviewScreenshot(lastScreenshot);
    }
  }, [lastScreenshot]);

  const { finishPerformanceReport } = usePerformanceMonitor(
    currentStatus === 'connected' ? sessionCode : '',
  );
  useRenderMetric('AttendantScreen');

  const codeCharacters = useMemo(
    () => sessionCode.padEnd(6, ' ').slice(0, 6).split(''),
    [sessionCode],
  );

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
              setPreviewScreenshot(null);
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
      if (
        sessionCodeRef.current &&
        currentStatusRef.current !== 'idle' &&
        currentStatusRef.current !== 'ended'
      ) {
        finishPerformanceReport();
        void endSession(sessionCodeRef.current);
      }
    };
  }, [finishPerformanceReport, initSession]);

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
      finishPerformanceReport();
      await endSession(sessionCode);
      dispatch(clearMessages());
      dispatch(clearSession());
      dispatch(clearScreenshot());
      navigation.navigate('RoleSelection');
    }
  }, [sessionCode, dispatch, finishPerformanceReport, navigation]);

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

  const handleCopyCode = useCallback(async () => {
    if (!sessionCode) {
      return;
    }

    await Clipboard.setStringAsync(sessionCode);
    setCopiedCode(true);
    copySuccessAnim.setValue(0);
    Animated.sequence([
      Animated.timing(copySuccessAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(copySuccessAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setCopiedCode(false));
  }, [copySuccessAnim, sessionCode]);

  const handleSelectTab = useCallback((tab: AttendantTab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      lastSeenClientMessageCountRef.current = clientMessageCount;
      setUnreadClientMessages(0);
    }
  }, [clientMessageCount]);

  if (isLoading) {
    return (
      <Box className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text className="mt-4 text-[14px]" style={{ color: colors.textSecondary }}>
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
          backgroundColor: colors.bg,
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
                backgroundColor: colors.dangerSoft,
                borderColor: colors.dangerBorder,
                borderWidth: 1,
              }}
            >
              <MaterialCommunityIcons name="database-alert" size={36} color={colors.danger} />
            </Box>
            <VStack className="items-center" space="xs">
              <Text className="text-center text-[25px] leading-[30px]" style={{ color: colors.text }} weight="bold">
                Não foi possível criar a sessão
              </Text>
              <Text className="max-w-[270px] text-center text-[13px] leading-[19px]" style={{ color: colors.dangerLight }}>
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
                borderColor: colors.inputBorder,
              }}
              onPress={() => navigation.navigate('RoleSelection')}
            >
              <ButtonText variant="outline" tone="secondary" style={{ color: colors.textSecondary }}>
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
        style={{ flex: 1 }}
      >
        <Box className="flex-1" style={{ backgroundColor: colors.bg }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Animated.View
            style={{
              flex: 1,
              opacity: connectedAnim,
              transform: [
                {
                  translateY: connectedAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            }}
          >
            <VStack
              className="px-4 pb-3"
              style={{ backgroundColor: colors.bg, paddingTop: Math.max(insets.top, 24) + 10 }}
              space="sm"
            >
              <HStack
                className="items-center justify-between rounded-2xl border px-4 py-3"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                }}
              >
                <HStack className="items-center flex-1" space="md">
                  <Box className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.surfaceElevated }}>
                    <AttendantIcon size={22} />
                  </Box>
                  <VStack className="flex-1" space="xs">
                    <HStack className="items-center" space="sm">
                      <Text className="text-[16px]" style={{ color: colors.text }} weight="bold">
                        Atendente
                      </Text>
                    </HStack>
                    <Text className="text-[12px] leading-4" style={{ color: colors.textSecondary }} weight="semibold">
                      Sessão #{sessionCode}
                    </Text>
                  </VStack>
                </HStack>
                <StatusBadge
                  status={isWaitingForConnection ? 'waiting' : currentStatus}
                  label={isWaitingForConnection ? 'Aguardando conexão' : undefined}
                />
              </HStack>

              <Box
                className="rounded-2xl p-1"
                style={{
                  width: tabContainerWidth,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 4,
                    top: 4,
                    width: tabIndicatorWidth,
                    bottom: 4,
                    borderRadius: 12,
                    backgroundColor: colors.accent,
                    transform: [
                      {
                        translateX: tabProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, tabIndicatorWidth],
                        }),
                      },
                    ],
                  }}
                />
                <HStack>
                  <TabButton
                    active={activeTab === 'controls'}
                    label="Controles"
                    icon="view-dashboard-outline"
                    onPress={() => handleSelectTab('controls')}
                  />
                  <TabButton
                    active={activeTab === 'chat'}
                    label="Chat"
                    icon="message-text-outline"
                    onPress={() => handleSelectTab('chat')}
                    badgeCount={unreadClientMessages}
                    badgePulse={badgePulse}
                  />
                </HStack>
              </Box>
            </VStack>

            {activeTab === 'controls' ? (
              <ScrollView
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: Math.max(insets.bottom, 16) + 88,
                  gap: 12,
                }}
              >
                <VStack
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
                  space="md"
                >
                  <HStack className="items-center justify-between">
                    <VStack className="flex-1" space="xs">
                      <Text className="text-[12px] uppercase tracking-[1px]" style={{ color: colors.textSecondary }} weight="bold">
                        Captura do cliente
                      </Text>
                      <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                        Solicite a tela renderizada do app em tempo real.
                      </Text>
                    </VStack>
                    <Box className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accentSoft }}>
                      <MaterialCommunityIcons name="monitor-screenshot" size={21} color={colors.accent} />
                    </Box>
                  </HStack>

                  <ScreenshotButton
                    onPress={() => void handleRequestScreenshot()}
                    isLoading={isSending}
                  />

                  {lastScreenshot ? (
                    <Pressable onPress={() => setPreviewScreenshot(lastScreenshot)}>
                      <HStack
                        className="items-center rounded-xl border p-3"
                        style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.separator }}
                        space="md"
                      >
                        <Image
                          source={{ uri: `data:image/jpeg;base64,${lastScreenshot}` }}
                          style={{ width: 58, height: 76, borderRadius: 10, backgroundColor: colors.bg }}
                          resizeMode="cover"
                        />
                        <VStack className="flex-1" space="xs">
                          <Text className="text-[14px]" style={{ color: colors.text }} weight="bold">
                            Última captura recebida
                          </Text>
                          <Text className="text-[12px]" style={{ color: colors.textSecondary }}>
                            Toque para visualizar em tela cheia.
                          </Text>
                        </VStack>
                        <MaterialCommunityIcons name="arrow-expand" size={20} color={colors.textSecondary} />
                      </HStack>
                    </Pressable>
                  ) : (
                    <Box
                      className="items-center rounded-xl border border-dashed px-4 py-5"
                      style={{ borderColor: colors.separator, backgroundColor: colors.surfaceElevated }}
                    >
                      <Text className="text-center text-[12px]" style={{ color: colors.textSecondary }}>
                        Nenhuma captura recebida ainda.
                      </Text>
                    </Box>
                  )}

                  {screenshotError ? (
                    <Box
                      className="rounded-xl border px-4 py-3"
                      style={{
                        backgroundColor: colors.dangerSoft,
                        borderColor: colors.dangerBorder,
                      }}
                    >
                      <Text className="text-center text-[12px]" style={{ color: colors.danger }} weight="medium">
                        {screenshotError}
                      </Text>
                    </Box>
                  ) : null}
                </VStack>

                <VStack
                  className="overflow-hidden rounded-2xl border"
                  style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
                  space="xs"
                >
                  <Box className="px-4 pt-4">
                    <Text className="text-[12px] uppercase tracking-[1px]" style={{ color: colors.textSecondary }} weight="bold">
                      Comandos rápidos
                    </Text>
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
                </VStack>

                <VStack
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
                  space="sm"
                >
                  <HStack className="items-center justify-between">
                    <Text className="text-[12px] uppercase tracking-[1px]" style={{ color: colors.textSecondary }} weight="bold">
                      WebView do atendente
                    </Text>
                    <Text className="text-[12px]" style={{ color: colors.textTertiary }}>
                      Local
                    </Text>
                  </HStack>

                  <HStack className="items-center" space="sm">
                    <Input
                      className="flex-1"
                      value={supportUrl}
                      onChangeText={setSupportUrl}
                      placeholder="https://exemplo.com"
                      placeholderTextColor={colors.placeholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }}
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
              </ScrollView>
            ) : (
              <ChatScreen sessionCode={sessionCode} currentRole="attendant" />
            )}

            {activeTab === 'controls' && !isKeyboardVisible && (
              <Box
                className="absolute bottom-0 left-0 right-0 px-4 pt-3"
                style={{
                  backgroundColor: colors.card,
                  paddingBottom: Math.max(insets.bottom, 12),
                  borderTopWidth: 1,
                  borderTopColor: colors.separator,
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
              base64={previewScreenshot}
              onClose={() => setPreviewScreenshot(null)}
            />
          </Animated.View>
        </Box>
      </KeyboardAvoidingView>
    );
  }

  return (
    <Box
      className="flex-1 px-6"
      style={{
        backgroundColor: colors.bg,
        paddingTop: Math.max(insets.top, 24) + 16,
        paddingBottom: Math.max(insets.bottom, 20),
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View
        style={{
          flex: 1,
          opacity: entryAnim,
          transform: [
            {
              translateY: entryAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        <VStack className="flex-1" space="xl">
          <BrandHeader />
          <NetworkStatusBanner hideWhenOnline offlineLabel="Sem conexão com a internet" />

          <VStack className="flex-1 justify-center" space="xl">
          <VStack className="items-center" space="md">
            <Box className="h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceElevated }}>
              <AttendantIcon large />
            </Box>
            <VStack className="items-center" space="xs">
              <Text className="text-[25px] leading-[30px]" style={{ color: colors.text }} weight="bold">
                Painel do atendente
              </Text>
              <Text className="max-w-[270px] text-center text-[13px] leading-[19px]" style={{ color: colors.textSecondary }}>
                Compartilhe o código abaixo para iniciar o suporte remoto.
              </Text>
            </VStack>
          </VStack>

          <VStack
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            }}
            space="lg"
          >
            <HStack className="items-center justify-between">
              <VStack space="xs">
                <Text className="text-[12px] uppercase tracking-[1px]" style={{ color: colors.textSecondary }} weight="bold">
                  Ticket de conexão
                </Text>
                <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                  Código da sessão
                </Text>
              </VStack>
              <Animated.View
                style={{
                  opacity: waitingPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.55, 1],
                  }),
                  transform: [
                    {
                      scale: waitingPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.96, 1],
                      }),
                    },
                  ],
                }}
              >
                <HStack
                  className="items-center rounded-full px-3 py-2"
                  style={{ backgroundColor: colors.successSoft }}
                  space="xs"
                >
                  <Box className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.success }} />
                  <Text className="text-[11px]" style={{ color: colors.success }} weight="bold">
                    Aguardando
                  </Text>
                </HStack>
              </Animated.View>
            </HStack>

            <HStack className="justify-between" space="sm">
              {codeCharacters.map((character, index) => (
                <Box
                  key={`${character}-${index}`}
                  className="h-14 flex-1 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.separator,
                  }}
                >
                  <Text
                    className="text-[24px] leading-[30px]"
                    style={{ color: colors.accent, fontVariant: ['tabular-nums'] }}
                    weight="bold"
                  >
                    {character}
                  </Text>
                </Box>
              ))}
            </HStack>

            <Button className="min-h-12" onPress={() => void handleCopyCode()}>
              <HStack className="items-center justify-center" space="sm">
                <Animated.View
                  style={{
                    opacity: copySuccessAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    position: copiedCode ? 'absolute' : 'relative',
                  }}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color="#FFFFFF" />
                </Animated.View>
                <Animated.View
                  style={{
                    opacity: copySuccessAnim,
                    position: copiedCode ? 'relative' : 'absolute',
                    transform: [
                      {
                        scale: copySuccessAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <MaterialCommunityIcons name="check" size={19} color="#FFFFFF" />
                </Animated.View>
                <ButtonText>{copiedCode ? 'Código copiado' : 'Copiar código'}</ButtonText>
              </HStack>
            </Button>
          </VStack>

          <VStack space="md">
            {currentStatus === 'ended' && (
              <HStack
                className="justify-center rounded-xl border px-5 py-3"
                style={{
                  backgroundColor: colors.dangerSoft,
                  borderColor: colors.dangerBorder,
                }}
                space="sm"
              >
                <Text className="text-[13px]" style={{ color: colors.danger }} weight="semibold">
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
        </VStack>
      </Animated.View>
    </Box>
  );
}

function TabButton({
  active,
  label,
  icon,
  badgeCount = 0,
  badgePulse,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  badgeCount?: number;
  badgePulse?: Animated.Value;
  onPress: () => void;
}): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <Pressable
      className="min-h-11 flex-1 flex-row items-center justify-center rounded-xl"
      onPress={onPress}
    >
      <HStack className="items-center justify-center" space="xs">
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={active ? '#FFFFFF' : colors.textSecondary}
        />
        <Text
          className="text-[13px]"
          style={{ color: active ? '#FFFFFF' : colors.textSecondary }}
          weight="bold"
        >
          {label}
        </Text>
        {badgeCount > 0 && badgePulse ? (
          <Animated.View
            style={{
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              paddingHorizontal: 5,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EF4444',
              opacity: badgePulse,
            }}
          >
            <Text className="text-[10px] leading-[12px] text-white" weight="bold">
              {badgeCount > 9 ? '9+' : badgeCount}
            </Text>
          </Animated.View>
        ) : null}
      </HStack>
    </Pressable>
  );
}

function AttendantIcon({ large = false, size }: { large?: boolean; size?: number }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <MaterialCommunityIcons name="tools" size={size ?? (large ? 36 : 22)} color={colors.iconDefault} />
  );
}

function BrandHeader(): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <HStack className="items-center justify-center" space="xs">
      <MaterialCommunityIcons name="headset" size={20} color={colors.accent} />
      <Text className="text-[19px] leading-[23px]" style={{ color: colors.text }} weight="bold">
        Remote Support
      </Text>
    </HStack>
  );
}
