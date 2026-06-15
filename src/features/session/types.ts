export type SessionStatus = 'idle' | 'waiting' | 'connected' | 'ended';

export type UserRole = 'attendant' | 'client';

export interface Session {
  code: string;
  status: SessionStatus;
  role: UserRole | null;
  attendantConnected: boolean;
  clientConnected: boolean;
  attendantOnline?: boolean;
  clientOnline?: boolean;
  attendantLastSeenAt?: number;
  clientLastSeenAt?: number;
  createdAt: number;
}
