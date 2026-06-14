import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ScreenshotRequest, ScreenshotState } from '../types';

const initialState: ScreenshotState = {
  pendingRequest: null,
  lastScreenshot: null,
  isSending: false,
  error: null,
};

const screenshotSlice = createSlice({
  name: 'screenshot',
  initialState,
  reducers: {
    setPendingRequest(state, action: PayloadAction<ScreenshotRequest | null>) {
      state.pendingRequest = action.payload;
    },
    setLastScreenshot(state, action: PayloadAction<string | null>) {
      state.lastScreenshot = action.payload;
    },
    setIsSending(state, action: PayloadAction<boolean>) {
      state.isSending = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearScreenshot(state) {
      state.pendingRequest = null;
      state.lastScreenshot = null;
      state.isSending = false;
      state.error = null;
    },
  },
});

export const {
  setPendingRequest,
  setLastScreenshot,
  setIsSending,
  setError,
  clearScreenshot,
} = screenshotSlice.actions;

export const screenshotReducer = screenshotSlice.reducer;
