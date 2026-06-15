import {
  clearSession,
  sessionReducer,
  setError,
  setRole,
  setSession,
  setStatus,
} from './sessionSlice';
import type { Session } from '../types';

const session: Session = {
  code: 'ABC123',
  role: null,
  status: 'connected',
  attendantConnected: true,
  clientConnected: true,
  attendantOnline: true,
  clientOnline: true,
  createdAt: 100,
};

describe('sessionSlice', () => {
  it('stores role, session, status and error', () => {
    let state = sessionReducer(undefined, setRole('attendant'));
    state = sessionReducer(state, setSession(session));
    state = sessionReducer(state, setStatus('connected'));
    state = sessionReducer(state, setError('Falha'));

    expect(state.role).toBe('attendant');
    expect(state.session).toEqual(session);
    expect(state.status).toBe('connected');
    expect(state.error).toBe('Falha');
  });

  it('clears all session state', () => {
    const filled = {
      session,
      status: 'connected' as const,
      role: 'client' as const,
      error: 'Erro',
    };

    expect(sessionReducer(filled, clearSession())).toEqual({
      session: null,
      status: 'idle',
      role: null,
      error: null,
    });
  });
});
