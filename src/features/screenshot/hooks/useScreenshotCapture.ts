import { useEffect, useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setPendingRequest,
  setLastScreenshot,
  setIsSending,
  setError,
} from '../store';
import { listenToScreenshotRequest, sendScreenshot } from '../services';

export function useScreenshotCapture(sessionCode: string) {
  const dispatch = useAppDispatch();
  const isSending = useAppSelector((state) => state.screenshot.isSending);
  const captureRef = useRef<any>(null);

  const captureAndSend = async (): Promise<void> => {
    if (!captureRef.current) {
      dispatch(setError('Referência de captura não está disponível.'));
      return;
    }

    dispatch(setIsSending(true));
    dispatch(setError(null));

    try {
      const base64 = await captureRef.current.capture({
        format: 'jpg',
        quality: 0.4,
        result: 'base64',
      });

      await sendScreenshot(sessionCode, base64);
      dispatch(setLastScreenshot(base64));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido na captura';
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setIsSending(false));
    }
  };

  useEffect(() => {
    if (!sessionCode) {
      return undefined;
    }

    const unsubscribe = listenToScreenshotRequest(sessionCode, (request) => {
      dispatch(setPendingRequest(request));
      if (request && request.base64 === null) {
        void captureAndSend();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionCode, dispatch]);

  return {
    captureRef,
    captureAndSend,
    isSending,
  };
}
