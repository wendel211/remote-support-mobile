import {
  createSnapshot,
  mockOnValue,
  mockPush,
  mockRemove,
  mockSet,
  mockUpdate,
  resetFirebaseDatabaseMocks,
} from '@test/firebaseDatabaseMock';
import {
  acknowledgeCommand,
  clearCommands,
  listenToPendingCommand,
  sendCommand,
} from './commandsService';

jest.mock('@services/firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  ref: jest.fn((_database, path) => ({ path })),
  push: mockPush,
  set: mockSet,
  update: mockUpdate,
  remove: mockRemove,
  onValue: mockOnValue,
}));

describe('commandsService', () => {
  beforeEach(() => {
    resetFirebaseDatabaseMocks();
    jest.spyOn(Date, 'now').mockReturnValue(500);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends a command with metadata', async () => {
    const id = await sendCommand('ABC123', {
      type: 'NAVIGATE_URL',
      label: 'Abrir URL',
      payload: { url: 'https://example.com' },
    });

    expect(id).toBe('generated-id');
    expect(mockSet).toHaveBeenCalledWith(expect.anything(), {
      type: 'NAVIGATE_URL',
      label: 'Abrir URL',
      payload: { url: 'https://example.com' },
      sentAt: 500,
      acknowledgedAt: null,
    });
  });

  it('acknowledges and clears commands', async () => {
    await acknowledgeCommand('ABC123', 'cmd1');
    await clearCommands('ABC123');

    expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), { acknowledgedAt: 500 });
    expect(mockRemove).toHaveBeenCalled();
  });

  it('listens to the latest pending command', () => {
    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(
        createSnapshot(true, {
          old: { type: 'OPEN_SETTINGS', label: 'Configurações', sentAt: 10, acknowledgedAt: null },
          done: { type: 'CLEAR_CACHE', label: 'Limpar', sentAt: 30, acknowledgedAt: 40 },
          latest: { type: 'SHOW_INFO', label: 'Info', sentAt: 20, acknowledgedAt: null },
        }),
      );
      return jest.fn();
    });
    const callback = jest.fn();

    listenToPendingCommand('ABC123', callback);

    expect(callback).toHaveBeenCalledWith({
      id: 'latest',
      type: 'SHOW_INFO',
      label: 'Info',
      sentAt: 20,
      acknowledgedAt: null,
    });
  });

  it('emits null when there is no command', () => {
    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(createSnapshot(false, null));
      return jest.fn();
    });
    const callback = jest.fn();

    listenToPendingCommand('ABC123', callback);

    expect(callback).toHaveBeenCalledWith(null);
  });

  it('emits null when every command was acknowledged', () => {
    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(
        createSnapshot(true, {
          done: { type: 'CLEAR_CACHE', label: 'Limpar', sentAt: 30, acknowledgedAt: 40 },
        }),
      );
      return jest.fn();
    });
    const callback = jest.fn();

    listenToPendingCommand('ABC123', callback);

    expect(callback).toHaveBeenCalledWith(null);
  });
});
