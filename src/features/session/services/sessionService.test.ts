import {
  createSnapshot,
  mockGet,
  mockOnDisconnect,
  mockOnDisconnectUpdate,
  mockOnValue,
  mockRef,
  mockSet,
  mockUpdate,
  resetFirebaseDatabaseMocks,
} from '@test/firebaseDatabaseMock';
import {
  createSession,
  endSession,
  generateSessionCode,
  joinSession,
  listenToSession,
  registerAttendantPresence,
  updateSessionStatus,
} from './sessionService';

jest.mock('@services/firebase', () => ({ database: {} }));
jest.mock('firebase/database', () => ({
  ref: mockRef,
  set: mockSet,
  get: mockGet,
  update: mockUpdate,
  onValue: mockOnValue,
  onDisconnect: mockOnDisconnect,
}));

describe('sessionService', () => {
  beforeEach(() => {
    resetFirebaseDatabaseMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates six-character uppercase codes', () => {
    const code = generateSessionCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('creates a waiting session', async () => {
    await createSession('ABC123');

    expect(mockRef).toHaveBeenCalledWith(expect.anything(), 'sessions/ABC123');
    expect(mockSet).toHaveBeenCalledWith(expect.anything(), {
      status: 'waiting',
      attendantConnected: true,
      clientConnected: false,
      attendantOnline: true,
      clientOnline: false,
      createdAt: 1000,
    });
  });

  it('normalizes permission errors when creating a session', async () => {
    mockSet.mockRejectedValueOnce(new Error('PERMISSION_DENIED'));

    await expect(createSession('ABC123')).rejects.toThrow('Permiss');
  });

  it('wraps unknown firebase errors with fallback messages', async () => {
    mockSet.mockRejectedValueOnce('unknown');
    await expect(createSession('ABC123')).rejects.toThrow('Erro ao criar');

    mockUpdate.mockRejectedValueOnce('unknown');
    await expect(registerAttendantPresence('ABC123')).rejects.toThrow('presen');

    mockGet.mockRejectedValueOnce('unknown');
    await expect(joinSession('ABC123')).rejects.toThrow('buscar');

    mockUpdate.mockRejectedValueOnce('unknown');
    await expect(updateSessionStatus('ABC123', 'ended')).rejects.toThrow('atualizar');

    mockUpdate.mockRejectedValueOnce('unknown');
    await expect(endSession('ABC123')).rejects.toThrow('encerrar');
  });

  it('registers attendant presence and onDisconnect cleanup', async () => {
    await registerAttendantPresence('ABC123');

    expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
      attendantConnected: true,
      attendantOnline: true,
    });
    expect(mockOnDisconnectUpdate).toHaveBeenCalledWith({
      attendantOnline: false,
      attendantConnected: false,
      status: 'ended',
    });
  });

  it('joins an available session and returns connected session data', async () => {
    mockGet.mockResolvedValueOnce(
      createSnapshot(true, {
        status: 'waiting',
        attendantConnected: true,
        clientConnected: false,
        createdAt: 1,
      }),
    );

    const session = await joinSession('ABC123');

    expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
      clientConnected: true,
      clientOnline: true,
      status: 'connected',
    });
    expect(session).toEqual({
      status: 'connected',
      attendantConnected: true,
      clientConnected: true,
      createdAt: 1,
      code: 'ABC123',
      role: null,
    });
  });

  it('normalizes errors while joining after reading session data', async () => {
    mockGet.mockResolvedValueOnce(
      createSnapshot(true, {
        status: 'waiting',
        attendantConnected: true,
        clientConnected: false,
        createdAt: 1,
      }),
    );
    mockUpdate.mockRejectedValueOnce(new Error('permission denied'));

    await expect(joinSession('ABC123')).rejects.toThrow('Permiss');
  });

  it('rejects missing or unavailable sessions', async () => {
    mockGet.mockResolvedValueOnce(createSnapshot(false, null));
    await expect(joinSession('ABC123')).rejects.toThrow('Sess');

    mockGet.mockResolvedValueOnce(createSnapshot(true, { status: 'connected' }));
    await expect(joinSession('ABC123')).rejects.toThrow('dispon');
  });

  it('updates and ends sessions', async () => {
    await updateSessionStatus('ABC123', 'connected');
    await endSession('ABC123');

    expect(mockUpdate).toHaveBeenNthCalledWith(1, expect.anything(), {
      status: 'connected',
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, expect.anything(), {
      status: 'ended',
      attendantConnected: false,
      clientConnected: false,
    });
  });

  it('listens to session changes', () => {
    const unsubscribe = jest.fn();
    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(
        createSnapshot(true, {
          status: 'connected',
          attendantConnected: true,
          clientConnected: true,
          createdAt: 1,
        }),
      );
      return unsubscribe;
    });
    const callback = jest.fn();

    const result = listenToSession('ABC123', callback);

    expect(callback).toHaveBeenCalledWith({
      status: 'connected',
      attendantConnected: true,
      clientConnected: true,
      createdAt: 1,
      code: 'ABC123',
      role: null,
    });
    expect(result).toBe(unsubscribe);
  });

  it('emits null when listened session does not exist', () => {
    mockOnValue.mockImplementationOnce((_ref, callback) => {
      callback(createSnapshot(false, null));
      return jest.fn();
    });
    const callback = jest.fn();

    listenToSession('ABC123', callback);

    expect(callback).toHaveBeenCalledWith(null);
  });
});
