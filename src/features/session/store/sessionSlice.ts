import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Session, SessionStatus, UserRole } from '../types';

interface SessionState {
  session: Session | null;
  status: SessionStatus;
  role: UserRole | null;
  error: string | null;
}

const initialState: SessionState = {
  session: null,
  status: 'idle',
  role: null,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<UserRole>) {
      state.role = action.payload;
    },
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
    },
    setStatus(state, action: PayloadAction<SessionStatus>) {
      state.status = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearSession(state) {
      state.session = null;
      state.status = 'idle';
      state.role = null;
      state.error = null;
    },
  },
});

export const { setRole, setSession, setStatus, setError, clearSession } =
  sessionSlice.actions;

export const sessionReducer = sessionSlice.reducer;
