import { useCallback, useEffect, useRef } from 'react';
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
  const captureRef = useRef<any>(null);
  const lastHandledRequestRef = useRef<number | null>(null);

  const captureAndSend = useCallback(async (): Promise<void> => {
    if (!sessionCode) {
      return;
    }

    if (!captureRef.current) {
      const message = 'Referencia de captura nao esta disponivel.';
      dispatch(setError(message));
      await sendScreenshotError(sessionCode, message);
      return;
    }

    dispatch(setIsSending(true));
    dispatch(setError(null));

    try {
      const base64 = await captureRef.current.capture({
        format: 'jpg',
        quality: 0.25,
        result: 'base64',
      });

      await sendScreenshot(sessionCode, base64);
      dispatch(setLastScreenshot(base64));
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
        request.base64 === null &&
        request.sentAt === null &&
        request.error === null &&
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
    captureRef,
    captureAndSend,
    isSending,
  };
}
