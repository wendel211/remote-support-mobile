import {
  createSnapshot,
  mockOnValue,
  mockPush,
  mockRef,
  mockServerTimestamp,
  mockSet,
  resetFirebaseDatabaseMocks,
} from '@test/firebaseDatabaseMock';
import {
  listenToMessages,
  listenToTyping,
  sendMessage,
  setTypingIndicator,
} from './chatService';

jest.mock('@services/firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  ref: mockRef,
  push: mockPush,
  set: mockSet,
  onValue: mockOnValue,
  serverTimestamp: mockServerTimestamp,
}));

describe('chatService', () => {
  beforeEach(() => {
    resetFirebaseDatabaseMocks();
  });

  it('sends a message with server timestamp and returns generated id', async () => {
    const id = await sendMessage('ABC123', {
      sessionCode: 'ABC123',
      text: 'Olá',
      role: 'client',
      timestamp: 10,
      status: 'sent',
    });

    expect(id).toBe('generated-id');
    expect(mockSet).toHaveBeenCalledWith(expect.anything(), {
      sessionCode: 'ABC123',
      text: 'Olá',
      role: 'client',
      timestamp: 999,
      status: 'sent',
    });
  });

  it('listens to ordered messages and falls back to Date.now for missing timestamp', () => {
    jest.spyOn(Date, 'now').mockReturnValue(777);
    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(
        createSnapshot(true, {
          b: { sessionCode: 'ABC123', text: '2', role: 'client', timestamp: 20, status: 'sent' },
          a: { sessionCode: 'ABC123', text: '1', role: 'attendant', status: 'sent' },
        }),
      );
      return jest.fn();
    });
    const callback = jest.fn();

    listenToMessages('ABC123', callback);

    expect(callback).toHaveBeenCalledWith([
      { id: 'b', sessionCode: 'ABC123', text: '2', role: 'client', timestamp: 20, status: 'sent' },
      { id: 'a', sessionCode: 'ABC123', text: '1', role: 'attendant', timestamp: 777, status: 'sent' },
    ]);
  });

  it('emits empty messages when the node does not exist', () => {
    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(createSnapshot(false, null));
      return jest.fn();
    });
    const callback = jest.fn();

    listenToMessages('ABC123', callback);

    expect(callback).toHaveBeenCalledWith([]);
  });

  it('sets and listens to typing indicators', async () => {
    await setTypingIndicator('ABC123', 'client', true);
    expect(mockSet).toHaveBeenCalledWith(expect.anything(), true);

    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(createSnapshot(true, true));
      return jest.fn();
    });
    const callback = jest.fn();
    listenToTyping('ABC123', 'client', callback);
    expect(callback).toHaveBeenCalledWith(true);

    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(createSnapshot(true, 'not-boolean'));
      return jest.fn();
    });
    listenToTyping('ABC123', 'client', callback);
    expect(callback).toHaveBeenCalledWith(false);
  });
});
