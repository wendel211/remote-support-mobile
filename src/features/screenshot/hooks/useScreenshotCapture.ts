import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { captureRef as captureViewShot } from 'react-native-view-shot';
import { sendMessage } from '@features/chat';
import {
  setPendingRequest,
  setLastScreenshot,
  setIsSending,
  setError,
} from '../store';
import {
  listenToScreenshotRequest,
  sendScreenshot,
  sendScreenshotError,
} from '../services';

export function useScreenshotCapture(sessionCode: string) {
  const dispatch = useAppDispatch();
  const isSending = useAppSelector((state) => state.screenshot.isSending);
  const viewRef = useRef<any>(null);
  const lastHandledRequestRef = useRef<number | null>(null);

  const captureAndSend = useCallback(async (): Promise<void> => {
    console.log('[CLIENT] useScreenshotCapture: Iniciando captureAndSend...');
    if (!sessionCode) {
      console.log('[CLIENT] useScreenshotCapture: sessionCode nulo ou vazio.');
      return;
    }

    if (!viewRef.current) {
      const message = 'Referencia de captura nao esta disponivel.';
      console.warn('[CLIENT] useScreenshotCapture: viewRef.current eh nulo!');
      dispatch(setError(message));
      await sendScreenshotError(sessionCode, message);
      return;
    }

    // Limpa erros anteriores mas não muda isSending ainda para manter a UI estática na captura
    dispatch(setError(null));

    try {
      console.log('[CLIENT] useScreenshotCapture: Aguardando a thread de UI estabilizar...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log('[CLIENT] useScreenshotCapture: Chamando captureViewShot com proteção de timeout...');
      const base64 = await Promise.race([
        captureViewShot(viewRef.current, {
          format: 'jpg',
          quality: 0.25,
          result: 'base64',
        }),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Tempo limite excedido ao gerar a captura de tela.')), 4000)
        ),
      ]);
      console.log('[CLIENT] useScreenshotCapture: Captura com sucesso! Tamanho:', base64?.length);

      // Agora que a captura foi feita, atualiza o estado de envio para mostrar a barra de progresso
      dispatch(setIsSending(true));

      await sendScreenshot(sessionCode, base64);
      console.log('[CLIENT] useScreenshotCapture: Screenshot enviada ao Firebase.');
      dispatch(setLastScreenshot(base64));

      await sendMessage(sessionCode, {
        sessionCode,
        text: 'Captura de tela compartilhada com o atendente.',
        role: 'system',
        status: 'sent',
        timestamp: Date.now(),
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido na captura.';
      console.error('[CLIENT] useScreenshotCapture: Erro na captura/envio:', errorMessage);
      dispatch(setError(errorMessage));
      await sendScreenshotError(sessionCode, errorMessage);
    } finally {
      dispatch(setIsSending(false));
    }
  }, [sessionCode, dispatch]);

  useEffect(() => {
    if (!sessionCode) {
      console.log('[CLIENT] useScreenshotCapture useEffect: Sem sessionCode ativo.');
      return undefined;
    }

    console.log('[CLIENT] useScreenshotCapture useEffect: Ativando listenToScreenshotRequest para:', sessionCode);
    const unsubscribe = listenToScreenshotRequest(sessionCode, (request) => {
      console.log('[CLIENT] useScreenshotCapture: Recebeu dados de screenshot do Firebase:', request);
      dispatch(setPendingRequest(request));
    });

    return () => {
      console.log('[CLIENT] useScreenshotCapture: Desinscrevendo do listenToScreenshotRequest.');
      unsubscribe();
    };
  }, [sessionCode, dispatch, captureAndSend]);

  return {
    viewRef,
    captureAndSend,
    isSending,
  };
}
