import {
  clearScreenshot,
  screenshotReducer,
  setError,
  setIsSending,
  setLastScreenshot,
  setPendingRequest,
} from './screenshotSlice';
import type { ScreenshotRequest } from '../types';

const request: ScreenshotRequest = {
  base64: null,
  error: null,
  requestedAt: 100,
  sentAt: null,
};

describe('screenshotSlice', () => {
  it('stores screenshot request, image, loading and error state', () => {
    let state = screenshotReducer(undefined, setPendingRequest(request));
    state = screenshotReducer(state, setLastScreenshot('base64'));
    state = screenshotReducer(state, setIsSending(true));
    state = screenshotReducer(state, setError('Falha'));

    expect(state.pendingRequest).toEqual(request);
    expect(state.lastScreenshot).toBe('base64');
    expect(state.isSending).toBe(true);
    expect(state.error).toBe('Falha');
  });

  it('clears screenshot state', () => {
    const state = screenshotReducer(
      {
        pendingRequest: request,
        lastScreenshot: 'base64',
        isSending: true,
        error: 'Falha',
      },
      clearScreenshot(),
    );

    expect(state).toEqual({
      pendingRequest: null,
      lastScreenshot: null,
      isSending: false,
      error: null,
    });
  });
});
