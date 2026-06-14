import { useCallback, useEffect, useRef } from 'react';
import { captureRef as captureViewShot } from 'react-native-view-shot';
import { sendMessage } from '@features/chat';
import { useAppDispatch, useAppSelector } from '@store/hooks';
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
    if (!sessionCode) {
      return;
    }

    if (!viewRef.current) {
      const message = 'Referência de captura não está disponível.';
      dispatch(setError(message));
      await sendScreenshotError(sessionCode, message);
      return;
    }

    dispatch(setError(null));

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const base64 = await Promise.race([
        captureViewShot(viewRef.current, {
          format: 'jpg',
          quality: 0.25,
          result: 'base64',
        }),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error('Tempo limite excedido ao gerar a captura de tela.')),
            4000,
          ),
        ),
      ]);

      dispatch(setIsSending(true));

      await sendScreenshot(sessionCode, base64);
      dispatch(setLastScreenshot(base64));

      await sendMessage(sessionCode, {
        sessionCode,
        text: 'Captura da tela do app enviada ao atendente.',
        role: 'system',
        status: 'sent',
        timestamp: Date.now(),
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido na captura.';
      dispatch(setError(errorMessage));
      await sendScreenshotError(sessionCode, errorMessage);
    } finally {
      dispatch(setIsSending(false));
    }
  }, [sessionCode, dispatch]);

  useEffect(() => {
    if (!sessionCode) {
      return undefined;
    }

    const unsubscribe = listenToScreenshotRequest(sessionCode, (request) => {
      dispatch(setPendingRequest(request));

      if (
        request &&
        request.base64 == null &&
        request.sentAt == null &&
        request.error == null &&
        request.requestedAt !== lastHandledRequestRef.current
      ) {
        lastHandledRequestRef.current = request.requestedAt;
        void captureAndSend();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionCode, dispatch, captureAndSend]);

  return {
    viewRef,
    captureAndSend,
    isSending,
  };
}
