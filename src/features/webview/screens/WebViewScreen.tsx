import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  WebViewProgressEvent,
  WebViewErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WebView'>;

function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch {
    return url;
  }
}

export function WebViewScreen({ route, navigation }: Props): React.JSX.Element {
  const { url, title } = route.params;

  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const displayTitle = title ?? extractDomain(url);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    progressAnim.setValue(0);
  }, [progressAnim]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      progressAnim.setValue(0);
    });
  }, [progressAnim]);

  const handleLoadProgress = useCallback(
    (event: WebViewProgressEvent) => {
      Animated.timing(progressAnim, {
        toValue: event.nativeEvent.progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    },
    [progressAnim],
  );

  const handleError = useCallback((_event: WebViewErrorEvent) => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Header customizado */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayTitle}
        </Text>

        {/* Espaçador para centralizar o título */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[styles.progressBarFill, { width: progressWidth }]}
        />
      </View>

      {/* WebView */}
      {!hasError && (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webView}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onLoadProgress={handleLoadProgress}
          onError={handleError}
        />
      )}

      {/* Indicador de carregamento sobreposto */}
      {isLoading && !hasError && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}

      {/* Tela de erro */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorMessage}>{url}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 72,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 72,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#4F46E5',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
