import {
  acknowledgeCommand,
  addSentCommand,
  clearCommands,
  commandsReducer,
  setError,
  setPendingCommand,
} from './commandsSlice';
import type { Command } from '../types';

const command: Command = {
  id: 'cmd1',
  type: 'OPEN_SETTINGS',
  label: 'Configurações',
  sentAt: 100,
  acknowledgedAt: null,
};

describe('commandsSlice', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(250);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stores pending and sent commands', () => {
    let state = commandsReducer(undefined, setPendingCommand(command));
    state = commandsReducer(state, addSentCommand(command));

    expect(state.pendingCommand).toEqual(command);
    expect(state.sentCommands).toEqual([command]);
  });

  it('acknowledges known commands and ignores unknown commands', () => {
    let state = commandsReducer(undefined, addSentCommand(command));
    state = commandsReducer(state, acknowledgeCommand('missing'));
    expect(state.sentCommands[0].acknowledgedAt).toBeNull();

    state = commandsReducer(state, acknowledgeCommand('cmd1'));
    expect(state.sentCommands[0].acknowledgedAt).toBe(250);
  });

  it('stores errors and clears command state', () => {
    let state = commandsReducer(undefined, setError('Erro'));
    state = commandsReducer(state, setPendingCommand(command));
    state = commandsReducer(state, clearCommands());

    expect(state).toEqual({
      pendingCommand: null,
      sentCommands: [],
      error: null,
    });
  });
});
