export type CommandType =
  | 'OPEN_SETTINGS'
  | 'RESTART_APP'
  | 'NAVIGATE_URL'
  | 'CLEAR_CACHE'
  | 'SHOW_INFO';

export interface Command {
  id: string;
  type: CommandType;
  label: string;
  payload?: { url?: string };
  sentAt: number;
  acknowledgedAt: number | null;
}

export interface CommandsState {
  pendingCommand: Command | null;
  sentCommands: Command[];
  error: string | null;
}
