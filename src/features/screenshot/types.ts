export interface ScreenshotRequest {
  requestedAt: number;
  sentAt: number | null;
  base64: string | null;
}

export interface ScreenshotState {
  pendingRequest: ScreenshotRequest | null;
  lastScreenshot: string | null;
  isSending: boolean;
  error: string | null;
}
