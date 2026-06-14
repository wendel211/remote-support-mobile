import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DevSettings, Linking, Modal, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
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
import { StatusBadge } from '@shared/components';
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
  const { isDark } = useTheme();
  const error = useAppSelector((state) => state.session.error);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedCode, setConnectedCode] = useState('');
  const [showEndedModal, setShowEndedModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const isConnectedRef = useRef(false);
  const connectedCodeRef = useRef('');

  useEffect(() => {
    isConnectedRef.current = isConnected;
    connectedCodeRef.current = connectedCode;
  }, [isConnected, connectedCode]);

  usePerformanceMonitor(isConnected ? connectedCode : '');
  useRenderMetric('ClientScreen');

  const pendingCommand = useAppSelector(
    (state) => state.commands.pendingCommand,
  );

  const { viewRef, isSending } = useScreenshotCapture(connectedCode);

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
          if (
            !updatedSession ||
            updatedSession.status === 'ended' ||
            updatedSession.attendantConnected === false
          ) {
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }
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
      if (isConnectedRef.current && connectedCodeRef.current) {
        void endSession(connectedCodeRef.current);
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
      await endSession(connectedCode);
      dispatch(clearMessages());
      dispatch(clearSession());
      dispatch(clearScreenshot());
      navigation.navigate('RoleSelection');
    }
  }, [connectedCode, dispatch, navigation]);

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
          style={{ backgroundColor: isDark ? '#090D16' : '#F3F4F6' }}
          collapsable={false}
        >
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
                <Box className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }}>
                  <ClientIcon />
                </Box>
                <Text className="text-[17px]" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }} weight="bold">
                  Cliente
                </Text>
                <Box className="rounded-md px-2 py-0.5" style={{ backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }}>
                  <Text className="text-[12px] leading-4" style={{ color: isDark ? '#94A3B8' : '#64748B' }} weight="bold">
                    #{connectedCode}
                  </Text>
                </Box>
                <StatusBadge status="connected" />
              </HStack>
            </HStack>

          {isSending && (
            <Box
              className="rounded-xl border py-2"
              style={{
                backgroundColor: isDark ? 'rgba(249, 115, 22, 0.1)' : '#FFF7ED',
                borderColor: isDark ? 'rgba(249, 115, 22, 0.3)' : '#FED7AA'
              }}
            >
              <Text
                className="text-center text-[12px]"
                style={{ color: '#F97316' }}
                weight="semibold"
              >
                Enviando captura de tela...
              </Text>
            </Box>
          )}

          <HStack className="justify-center rounded-xl py-2" style={{ backgroundColor: isDark ? 'rgba(5, 150, 105, 0.1)' : '#ECFDF5' }} space="sm">
            <ConnectedIcon />
            <Text className="text-[12px] leading-4" style={{ color: isDark ? '#34D399' : '#059669' }} weight="semibold">
              Conectado ao atendente
            </Text>
          </HStack>
        </VStack>

        <ChatScreen
          sessionCode={connectedCode}
          currentRole="client"
        />

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
          <Box className="flex-1 items-center justify-center bg-black/60 px-8">
            <Box
              className="w-full rounded-panel px-6 py-8 shadow-soft"
              style={{
                backgroundColor: isDark ? '#161F30' : '#FFFFFF',
                borderWidth: isDark ? 1 : 0,
                borderColor: '#24334A'
              }}
            >
              <VStack className="items-center" space="md">
                <Box
                  className="h-16 w-16 items-center justify-center rounded-2xl border"
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                    borderColor: isDark ? '#7F1D1D' : '#FCA5A5'
                  }}
                >
                  <MaterialCommunityIcons name="alert-circle-outline" size={36} color={isDark ? '#EF4444' : '#DC2626'} />
                </Box>

                <VStack className="items-center" space="xs">
                  <Text className="text-center text-[20px] leading-[26px]" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }} weight="bold">
                    Sessão encerrada
                  </Text>
                  <Text className="text-center text-[13px] leading-[19px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    O atendimento foi encerrado pelo atendente.
                  </Text>
                </VStack>

                <Button className="mt-2 w-full" onPress={handleCloseEndedModal}>
                  <ButtonText>Entendido</ButtonText>
                </Button>
              </VStack>
            </Box>
          </Box>
        </Modal>
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
          <Box className="h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }}>
            <ClientIcon large />
          </Box>
          <VStack className="items-center" space="xs">
            <Text className="text-[25px] leading-[30px]" style={{ color: isDark ? '#FFFFFF' : '#111827' }} weight="bold">
              Entrar na sessão
            </Text>
            <Text className="max-w-[255px] text-center text-[13px] leading-[19px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              Digite o código de 6 caracteres fornecido pelo atendente.
            </Text>
          </VStack>
        </VStack>

        <Box
          className="rounded-2xl border p-5 shadow-sm"
          style={{
            backgroundColor: isDark ? '#161F30' : '#FFFFFF',
            borderColor: isDark ? '#24334A' : '#E2E8F0'
          }}
        >
          <VStack space="md">
            <Input
              className="min-h-[66px] text-center text-[25px] font-bold tracking-[8px]"
              value={code}
              onChangeText={handleCodeChange}
              placeholder="CÓDIGO"
              placeholderTextColor={isDark ? '#475569' : '#98A2B3'}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
              style={isDark ? { backgroundColor: '#090D16', borderColor: '#24334A', color: '#FFFFFF' } : undefined}
            />

            {error ? (
              <Box
                className="rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                  borderColor: isDark ? '#7F1D1D' : '#FCA5A5'
                }}
              >
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
              <ButtonText>Entrar na sessão</ButtonText>
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
        </Box>
      </VStack>

      <Modal
        visible={showEndedModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Box className="flex-1 items-center justify-center bg-black/60 px-8">
          <Box
            className="w-full rounded-panel px-6 py-8 shadow-soft"
            style={{
              backgroundColor: isDark ? '#161F30' : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: '#24334A'
            }}
          >
            <VStack className="items-center" space="md">
              <Box
                className="h-16 w-16 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                  borderColor: isDark ? '#7F1D1D' : '#FCA5A5'
                }}
              >
                <MaterialCommunityIcons name="alert-circle-outline" size={36} color={isDark ? '#EF4444' : '#DC2626'} />
              </Box>

              <VStack className="items-center" space="xs">
                <Text className="text-center text-[20px] leading-[26px]" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }} weight="bold">
                  Sessão encerrada
                </Text>
                <Text className="text-center text-[13px] leading-[19px]" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                  O atendimento foi encerrado pelo atendente.
                </Text>
              </VStack>

              <Button className="mt-2 w-full" onPress={handleCloseEndedModal}>
                <ButtonText>Entendido</ButtonText>
              </Button>
            </VStack>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

function ClientIcon({ large = false }: { large?: boolean }): React.JSX.Element {
  const { isDark } = useTheme();
  const scale = large ? 1.25 : 1;
  const color = isDark ? '#94A3B8' : '#374151';
  return (
    <Box style={{ height: 28 * scale, width: 28 * scale, alignItems: 'center' }}>
      <Box
        className="rounded-full"
        style={{
          marginTop: 5 * scale,
          height: 9 * scale,
          width: 9 * scale,
          backgroundColor: color
        }}
      />
      <Box
        className="rounded-t-full"
        style={{
          marginTop: 2 * scale,
          height: 9 * scale,
          width: 16 * scale,
          backgroundColor: color
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
