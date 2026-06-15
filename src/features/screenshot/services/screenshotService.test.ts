import {
  createSnapshot,
  mockOnValue,
  mockRemove,
  mockSet,
  mockUpdate,
  resetFirebaseDatabaseMocks,
} from '@test/firebaseDatabaseMock';
import {
  clearScreenshotRequest,
  listenToScreenshotRequest,
  requestScreenshot,
  sendScreenshot,
  sendScreenshotError,
} from './screenshotService';

jest.mock('@services/firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  ref: jest.fn((_database, path) => ({ path })),
  set: mockSet,
  update: mockUpdate,
  remove: mockRemove,
  onValue: mockOnValue,
}));

describe('screenshotService', () => {
  beforeEach(() => {
    resetFirebaseDatabaseMocks();
    jest.spyOn(Date, 'now').mockReturnValue(900);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests, sends and clears screenshots', async () => {
    await requestScreenshot('ABC123');
    await sendScreenshot('ABC123', 'base64');
    await sendScreenshotError('ABC123', 'Falha');
    await clearScreenshotRequest('ABC123');

    expect(mockSet).toHaveBeenCalledWith(expect.anything(), {
      base64: null,
      error: null,
      requestedAt: 900,
      sentAt: null,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(1, expect.anything(), {
      base64: 'base64',
      error: null,
      sentAt: 900,
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, expect.anything(), {
      base64: null,
      error: 'Falha',
      sentAt: 900,
    });
    expect(mockRemove).toHaveBeenCalled();
  });

  it('listens to screenshot request values and missing nodes', () => {
    const request = { base64: null, error: null, requestedAt: 1, sentAt: null };
    mockOnValue
      .mockImplementationOnce((_ref, callback) => {
        callback(createSnapshot(true, request));
        return jest.fn();
      })
      .mockImplementationOnce((_ref, callback) => {
        callback(createSnapshot(false, null));
        return jest.fn();
      });
    const callback = jest.fn();

    listenToScreenshotRequest('ABC123', callback);
    listenToScreenshotRequest('ABC123', callback);

    expect(callback).toHaveBeenNthCalledWith(1, request);
    expect(callback).toHaveBeenNthCalledWith(2, null);
  });
});
