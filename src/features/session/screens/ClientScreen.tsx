import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Client'>;

export function ClientScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.session.error);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedCode, setConnectedCode] = useState('');
  const unsubscribeRef = useRef<(() => void) | null>(null);

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
      <ViewShot ref={captureRef} style={styles.fullContainer}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>👤 Cliente</Text>
            <Text style={styles.headerCode}>{connectedCode}</Text>
          </View>
          <StatusBadge status="connected" />
        </View>

        {isSending && (
          <View style={styles.sendingIndicator}>
            <Text style={styles.sendingText}>Enviando screenshot...</Text>
          </View>
        )}

        <View style={styles.connectedBanner}>
          <Text style={styles.connectedIcon}>✅</Text>
          <Text style={styles.connectedText}>Conectado ao Atendente</Text>
        </View>

        <ChatScreen sessionCode={connectedCode} currentRole="client" />

        <Pressable
          style={({ pressed }) => [
            styles.leaveButton,
            pressed && styles.leaveButtonPressed,
          ]}
          onPress={() => void handleLeaveSession()}
        >
          <Text style={styles.leaveButtonText}>Sair da sessão</Text>
        </Pressable>
      </ViewShot>
    );
  }

  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.title}>Entrar na Sessão</Text>
      <Text style={styles.subtitle}>
        Digite o código fornecido pelo atendente
      </Text>

      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={handleCodeChange}
          placeholder="CÓDIGO"
          placeholderTextColor="#C4C4C4"
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.joinButton,
          pressed && styles.joinButtonPressed,
          (isLoading || code.length !== 6) && styles.joinButtonDisabled,
        ]}
        onPress={() => void handleJoinSession()}
        disabled={isLoading || code.length !== 6}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.joinButtonText}>Entrar na sessão</Text>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
        onPress={() => navigation.navigate('RoleSelection')}
        disabled={isLoading}
      >
        <Text style={styles.backButtonText}>Voltar</Text>
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
    color: '#0EA5E9',
    backgroundColor: '#F0F9FF',
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
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 16,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  joinButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    marginBottom: 12,
  },
  joinButtonPressed: {
    opacity: 0.85,
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  leaveButton: {
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  leaveButtonPressed: {
    opacity: 0.85,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sendingIndicator: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  sendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
});
