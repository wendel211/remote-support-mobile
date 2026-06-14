import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Command, CommandsState } from '../types';

const initialState: CommandsState = {
  pendingCommand: null,
  sentCommands: [],
  error: null,
};

const commandsSlice = createSlice({
  name: 'commands',
  initialState,
  reducers: {
    setPendingCommand(state, action: PayloadAction<Command | null>) {
      state.pendingCommand = action.payload;
    },
    addSentCommand(state, action: PayloadAction<Command>) {
      state.sentCommands.push(action.payload);
    },
    acknowledgeCommand(state, action: PayloadAction<string>) {
      const command = state.sentCommands.find((c) => c.id === action.payload);
      if (command) {
        command.acknowledgedAt = Date.now();
      }
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearCommands(state) {
      state.pendingCommand = null;
      state.sentCommands = [];
      state.error = null;
    },
  },
});

export const {
  setPendingCommand,
  addSentCommand,
  acknowledgeCommand,
  setError,
  clearCommands,
} = commandsSlice.actions;

export const commandsReducer = commandsSlice.reducer;
