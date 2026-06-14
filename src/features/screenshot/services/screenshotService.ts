import {
  ref,
  set,
  update,
  remove,
  onValue,
  type Unsubscribe,
} from 'firebase/database';
import { database } from '@services/firebase';
import type { ScreenshotRequest } from '../types';

export async function requestScreenshot(sessionCode: string): Promise<void> {
  const pendingRef = ref(database, `sessions/${sessionCode}/pendingScreenshot`);
  await set(pendingRef, {
    base64: null,
    error: null,
    requestedAt: Date.now(),
    sentAt: null,
  });
}

export async function sendScreenshot(
  sessionCode: string,
  base64: string,
): Promise<void> {
  const pendingRef = ref(database, `sessions/${sessionCode}/pendingScreenshot`);
  await update(pendingRef, {
    base64,
    error: null,
    sentAt: Date.now(),
  });
}

export async function sendScreenshotError(
  sessionCode: string,
  error: string,
): Promise<void> {
  const pendingRef = ref(database, `sessions/${sessionCode}/pendingScreenshot`);
  await update(pendingRef, {
    base64: null,
    error,
    sentAt: Date.now(),
  });
}

export function listenToScreenshotRequest(
  sessionCode: string,
  callback: (request: ScreenshotRequest | null) => void,
): Unsubscribe {
  const pendingRef = ref(database, `sessions/${sessionCode}/pendingScreenshot`);
  return onValue(pendingRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const val = snapshot.val() as ScreenshotRequest;
    callback(val);
  });
}

export async function clearScreenshotRequest(
  sessionCode: string,
): Promise<void> {
  const pendingRef = ref(database, `sessions/${sessionCode}/pendingScreenshot`);
  await remove(pendingRef);
}
