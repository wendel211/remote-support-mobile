import React, { useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  WebViewProgressEvent,
  WebViewErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { Box, Button, ButtonText, HStack, Text, VStack } from '@shared/ui';

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
    <Box className="flex-1 bg-surface">
      <HStack className="border-b border-border bg-surface px-4 pb-3 pt-14">
        <Button
          className="min-w-[72px] px-0"
          variant="ghost"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ButtonText variant="ghost">← Voltar</ButtonText>
        </Button>

        <Text className="flex-1 text-center" numberOfLines={1} weight="semibold">
          {displayTitle}
        </Text>

        <Box className="min-w-[72px]" />
      </HStack>

      <Box className="h-[3px] overflow-hidden bg-slate-200">
        <Animated.View
          style={{
            width: progressWidth,
            height: 3,
            backgroundColor: '#315DFF',
          }}
        />
      </Box>

      {!hasError && (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={{ flex: 1 }}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onLoadProgress={handleLoadProgress}
          onError={handleError}
        />
      )}

      {isLoading && !hasError && (
        <Box
          className="absolute inset-x-0 bottom-0 top-[120px] items-center justify-center bg-white/85"
          pointerEvents="none"
        >
          <ActivityIndicator size="large" color="#315DFF" />
        </Box>
      )}

      {hasError && (
        <Box className="flex-1 items-center justify-center px-8">
          <VStack className="items-center" space="md">
            <Text className="text-5xl">⚠️</Text>
            <Text className="text-center" size="lg" weight="bold">
              Não foi possível carregar
            </Text>
            <Text className="text-center" size="sm" tone="muted">
              {url}
            </Text>
            <Button className="mt-4 px-8" onPress={handleRetry}>
              <ButtonText>Tentar novamente</ButtonText>
            </Button>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
