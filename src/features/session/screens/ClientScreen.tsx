import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  DevSettings,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { sendMessage } from '@features/chat';
import type { Session } from '@features/session/types';
import { NetworkStatusBanner, StatusBadge } from '@shared/components';
import { ChatScreen } from '@features/chat/components';
import { useScreenshotCapture, clearScreenshot } from '@features/screenshot';
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
  useTheme,
} from '@shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Client'>;

export function ClientScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();
  const { isDark, colors } = useTheme();
  const error = useAppSelector((state) => state.session.error);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedCode, setConnectedCode] = useState('');
  const [showEndedModal, setShowEndedModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isConnectedRef = useRef(false);
  const connectedCodeRef = useRef('');
  const entryAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const sendingPulse = useRef(new Animated.Value(1)).current;
  const endedModalAnim = useRef(new Animated.Value(0)).current;
  const pendingCommand = useAppSelector(
    (state) => state.commands.pendingCommand,
  );
  const { viewRef, isSending } = useScreenshotCapture(connectedCode);
  const isOffline =
    netInfo.isConnected === false || netInfo.isInternetReachable === false;

  useEffect(() => {
    isConnectedRef.current = isConnected;
    connectedCodeRef.current = connectedCode;
  }, [isConnected, connectedCode]);

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [entryAnim]);

  useEffect(() => {
    if (!isSending) {
      sendingPulse.stopAnimation();
      sendingPulse.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sendingPulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(sendingPulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [isSending, sendingPulse]);

  useEffect(() => {
    if (!showEndedModal) {
      endedModalAnim.setValue(0);
      return;
    }

    Animated.spring(endedModalAnim, {
      toValue: 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [endedModalAnim, showEndedModal]);

  const { finishPerformanceReport } = usePerformanceMonitor(
    isConnected ? connectedCode : '',
  );
  useRenderMetric('ClientScreen');

  const runInvalidFeedback = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleJoinSession = useCallback(async () => {
    if (code.length !== 6) {
      runInvalidFeedback();
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
          if (
            !updatedSession ||
            updatedSession.status === 'ended'
          ) {
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }
            finishPerformanceReport();
            dispatch(clearMessages());
            dispatch(clearSession());
            dispatch(clearScreenshot());
            setShowEndedModal(true);
          } else {
            dispatch(setSession(updatedSession));
          }
        },
      );
    } catch (err: unknown) {
      runInvalidFeedback();
      const message =
        err instanceof Error ? err.message : 'Erro ao entrar na sessão.';
      dispatch(setError(message));
    } finally {
      setIsLoading(false);
    }
  }, [code, dispatch, finishPerformanceReport, runInvalidFeedback]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

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

  useEffect(() => {
    if (!connectedCode) {
      return undefined;
    }

    const unsubscribeCommands = listenToPendingCommand(
      connectedCode,
      (command) => {
        if (command?.type === 'NAVIGATE_URL' && command.payload?.url) {
          void acknowledgeCommand(connectedCode, command.id);
          dispatch(setPendingCommand(null));
          navigation.navigate('WebView', {
            url: command.payload.url,
          });
          return;
        }

        dispatch(setPendingCommand(command));
      },
    );

    return () => {
      unsubscribeCommands();
    };
  }, [connectedCode, dispatch, navigation]);

  const handleLeaveSession = useCallback(async () => {
    if (connectedCode) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      finishPerformanceReport();
      await endSession(connectedCode);
      dispatch(clearMessages());
      dispatch(clearSession());
      dispatch(clearScreenshot());
      navigation.navigate('RoleSelection');
    }
  }, [connectedCode, dispatch, finishPerformanceReport, navigation]);

  const handleCloseEndedModal = useCallback(() => {
    setShowEndedModal(false);
    setIsConnected(false);
    navigation.navigate('RoleSelection');
  }, [navigation]);

  const handleCodeChange = useCallback((text: string) => {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  }, []);

  const handleAcknowledgeCommand = useCallback(async () => {
    if (!pendingCommand) {
      return;
    }

    const command = pendingCommand;

    try {
      await acknowledgeCommand(connectedCode, command.id);

      if (command.type === 'OPEN_SETTINGS') {
        void Linking.openSettings();
      }

      if (command.type === 'CLEAR_CACHE') {
        dispatch(clearMessages());
        dispatch(clearScreenshot());
        await sendMessage(connectedCode, {
          sessionCode: connectedCode,
          text: 'Cache local do cliente limpo.',
          role: 'system',
          status: 'sent',
          timestamp: Date.now(),
        });
      }

      if (command.type === 'RESTART_APP') {
        setTimeout(() => {
          const reload = (DevSettings as typeof DevSettings & {
            reload?: () => void;
          }).reload;

          if (reload) {
            reload();
            return;
          }

          navigation.navigate('RoleSelection');
        }, 250);
      }
    } finally {
      dispatch(setPendingCommand(null));
    }
  }, [connectedCode, dispatch, navigation, pendingCommand]);

  if (isConnected) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <Box
          ref={viewRef}
          className="flex-1"
          style={{ backgroundColor: colors.bg }}
          collapsable={false}
        >
          <StatusBar style={isDark ? 'light' : 'dark'} />
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
                  <ClientIcon />
                </Box>
                <VStack className="flex-1" space="xs">
                  <HStack className="items-center" space="sm">
                    <Text className="text-[17px]" style={{ color: colors.text }} weight="bold">
                      Cliente
                    </Text>
                  </HStack>
                  <Text className="text-[12px] leading-4" style={{ color: colors.textSecondary }} weight="bold">
                    Sessão #{connectedCode}
                  </Text>
                </VStack>
              </HStack>
              <StatusBadge status={isOffline ? 'offline' : 'connected'} />
            </HStack>

            <HStack
              className="justify-center rounded-xl py-2"
              style={{
                backgroundColor: isOffline ? colors.dangerSoft : colors.successSoft,
              }}
              space="sm"
            >
              <Text
                className="text-[12px] leading-4"
                style={{ color: isOffline ? colors.danger : colors.success }}
                weight="semibold"
              >
                {isOffline ? 'Sessão não sincronizada' : 'Sessão ativa e sincronizada'}
              </Text>
            </HStack>
          </VStack>

          {isSending && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: Math.max(insets.top, 24) + 84,
                left: 16,
                right: 16,
                zIndex: 20,
                opacity: sendingPulse,
                transform: [
                  {
                    translateY: sendingPulse.interpolate({
                      inputRange: [0.4, 1],
                      outputRange: [-2, 0],
                    }),
                  },
                ],
              }}
            >
              <HStack
                className="items-center justify-center rounded-2xl border px-4 py-3"
                style={{
                  backgroundColor: colors.warningSoft,
                  borderColor: colors.warningBorder,
                }}
                space="sm"
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={colors.warning} />
                <Text className="text-center text-[12px]" style={{ color: colors.warning }} weight="semibold">
                  Enviando captura de tela...
                </Text>
              </HStack>
            </Animated.View>
          )}

          <ChatScreen
            sessionCode={connectedCode}
            currentRole="client"
          />

          {!isKeyboardVisible && (
            <Box
              className="px-4 pt-3"
              style={{
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom, 16),
                borderTopWidth: 1,
                borderTopColor: colors.separator,
              }}
            >
              <Button
                className="min-h-12 w-full"
                tone="danger"
                onPress={() => void handleLeaveSession()}
              >
                <HStack className="items-center justify-center" space="sm">
                  <MaterialCommunityIcons name="power" size={18} color="#FFFFFF" />
                  <ButtonText tone="danger">Sair da sessão</ButtonText>
                </HStack>
              </Button>
            </Box>
          )}

          <CommandModal
            command={pendingCommand}
            sessionCode={connectedCode}
            onAcknowledge={handleAcknowledgeCommand}
          />

          <Modal
            visible={showEndedModal}
            transparent
            animationType="fade"
            statusBarTranslucent
          >
            <Box className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.overlay }}>
              <Animated.View
                style={{
                  width: '100%',
                  opacity: endedModalAnim,
                  transform: [
                    {
                      scale: endedModalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.88, 1],
                      }),
                    },
                  ],
                }}
              >
                <Box
                  className="w-full rounded-panel px-6 py-8"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <VStack className="items-center" space="md">
                    <Box
                      className="h-16 w-16 items-center justify-center rounded-2xl border"
                      style={{
                        backgroundColor: colors.dangerSoft,
                        borderColor: colors.dangerBorder,
                      }}
                    >
                      <MaterialCommunityIcons name="alert-circle-outline" size={36} color={colors.danger} />
                    </Box>

                    <VStack className="items-center" space="xs">
                      <Text className="text-center text-[20px] leading-[26px]" style={{ color: colors.text }} weight="bold">
                        Sessão encerrada
                      </Text>
                      <Text className="text-center text-[13px] leading-[19px]" style={{ color: colors.textSecondary }}>
                        O atendimento foi encerrado pelo atendente.
                      </Text>
                    </VStack>

                    <Button className="mt-2 w-full" onPress={handleCloseEndedModal}>
                      <ButtonText>Entendido</ButtonText>
                    </Button>
                  </VStack>
                </Box>
              </Animated.View>
            </Box>
          </Modal>
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
              <ClientIcon large />
            </Box>
            <VStack className="items-center" space="xs">
              <Text className="text-[25px] leading-[30px]" style={{ color: colors.text }} weight="bold">
                Entrar na sessão
              </Text>
              <Text className="max-w-[255px] text-center text-[13px] leading-[19px]" style={{ color: colors.textSecondary }}>
                Digite o código de 6 caracteres fornecido pelo atendente.
              </Text>
            </VStack>
          </VStack>

          <Animated.View
            style={{
              transform: [
                {
                  translateX: shakeAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-8, 0, 8],
                  }),
                },
              ],
            }}
          >
            <Box
              className="rounded-2xl border p-5"
              style={{
                backgroundColor: colors.card,
                borderColor: error ? colors.dangerBorder : colors.cardBorder,
              }}
            >
              <VStack space="md">
                <Input
                  className="min-h-[66px] text-center text-[25px] font-bold tracking-[8px]"
                  value={code}
                  onChangeText={handleCodeChange}
                  onFocus={() => setIsCodeFocused(true)}
                  onBlur={() => setIsCodeFocused(false)}
                  placeholder="CÓDIGO"
                  placeholderTextColor={colors.placeholder}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isLoading}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: error ? colors.dangerBorder : isCodeFocused ? colors.accent : colors.inputBorder,
                    color: colors.inputText,
                    borderWidth: isCodeFocused ? 2 : 1,
                  }}
                />

                {error ? (
                  <Box
                    className="rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: colors.dangerSoft,
                      borderColor: colors.dangerBorder,
                    }}
                  >
                    <Text className="text-center text-[13px]" style={{ color: colors.danger }} weight="medium">
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
                  <ButtonText>Entrar na sessão</ButtonText>
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
            </Box>
          </Animated.View>
          </VStack>
        </VStack>
      </Animated.View>

      <Modal
        visible={showEndedModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Box className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.overlay }}>
          <Animated.View
            style={{
              width: '100%',
              opacity: endedModalAnim,
              transform: [
                {
                  scale: endedModalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.88, 1],
                  }),
                },
              ],
            }}
          >
            <Box
              className="w-full rounded-panel px-6 py-8"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <VStack className="items-center" space="md">
                <Box
                  className="h-16 w-16 items-center justify-center rounded-2xl border"
                  style={{
                    backgroundColor: colors.dangerSoft,
                    borderColor: colors.dangerBorder,
                  }}
                >
                  <MaterialCommunityIcons name="alert-circle-outline" size={36} color={colors.danger} />
                </Box>

                <VStack className="items-center" space="xs">
                  <Text className="text-center text-[20px] leading-[26px]" style={{ color: colors.text }} weight="bold">
                    Sessão encerrada
                  </Text>
                  <Text className="text-center text-[13px] leading-[19px]" style={{ color: colors.textSecondary }}>
                    O atendimento foi encerrado pelo atendente.
                  </Text>
                </VStack>

                <Button className="mt-2 w-full" onPress={handleCloseEndedModal}>
                  <ButtonText>Entendido</ButtonText>
                </Button>
              </VStack>
            </Box>
          </Animated.View>
        </Box>
      </Modal>
    </Box>
  );
}

function ClientIcon({ large = false }: { large?: boolean }): React.JSX.Element {
  const { colors } = useTheme();
  const scale = large ? 1.25 : 1;
  const color = colors.iconDefault;
  return (
    <Box style={{ height: 28 * scale, width: 28 * scale, alignItems: 'center' }}>
      <Box
        className="rounded-full"
        style={{
          marginTop: 5 * scale,
          height: 9 * scale,
          width: 9 * scale,
          backgroundColor: color,
        }}
      />
      <Box
        className="rounded-t-full"
        style={{
          marginTop: 2 * scale,
          height: 9 * scale,
          width: 16 * scale,
          backgroundColor: color,
        }}
      />
    </Box>
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
