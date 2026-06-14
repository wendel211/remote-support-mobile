import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
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
} from '@features/commands';
import type { Command } from '@features/commands';

type Props = NativeStackScreenProps<RootStackParamList, 'Attendant'>;

export function AttendantScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionCode, setSessionCode] = useState('');
  const [currentStatus, setCurrentStatus] = useState<SessionStatus>('idle');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const lastScreenshot = useAppSelector(
    (state) => state.screenshot.lastScreenshot,
  );
  const isSending = useAppSelector((state) => state.screenshot.isSending);

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
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Criando sessão...</Text>
      </View>
    );
  }

  if (currentStatus === 'connected') {
    return (
      <View style={styles.fullContainer}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>🛠️ Atendente</Text>
            <Text style={styles.headerCode}>{sessionCode}</Text>
          </View>
          <StatusBadge status={currentStatus} />
        </View>

        <View style={styles.connectedBanner}>
          <Text style={styles.connectedIcon}>✅</Text>
          <Text style={styles.connectedText}>Cliente conectado</Text>
        </View>

        <View style={styles.screenshotActionContainer}>
          <ScreenshotButton
            onPress={() => void handleRequestScreenshot()}
            isLoading={isSending}
          />
        </View>

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

        <Pressable
          style={({ pressed }) => [
            styles.endButton,
            pressed && styles.endButtonPressed,
          ]}
          onPress={() => void handleEndSession()}
        >
          <Text style={styles.endButtonText}>Encerrar sessão</Text>
        </Pressable>

        <ScreenshotViewer
          base64={lastScreenshot}
          onClose={() => dispatch(setLastScreenshot(null))}
        />
      </View>
    );
  }

  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.emoji}>🛠️</Text>
      <Text style={styles.title}>Painel do Atendente</Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Código da Sessão</Text>
        <Text style={styles.codeValue}>{sessionCode}</Text>
        <Text style={styles.codeHint}>
          Compartilhe este código com o cliente
        </Text>
      </View>

      <StatusBadge status={currentStatus} />

      {currentStatus === 'ended' && (
        <View style={styles.endedCard}>
          <Text style={styles.endedIcon}>🔴</Text>
          <Text style={styles.endedText}>Sessão encerrada</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.endButton,
          pressed && styles.endButtonPressed,
        ]}
        onPress={() => void handleEndSession()}
      >
        <Text style={styles.endButtonText}>Encerrar sessão</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  headerCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  connectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
  },
  connectedIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  connectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 32,
  },
  codeCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 6,
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  endedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  endedIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  endedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
  },
  endButton: {
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  endButtonPressed: {
    opacity: 0.85,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  screenshotActionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
});
