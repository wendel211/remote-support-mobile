import {
  ref,
  set,
  get,
  update,
  onValue,
  type Unsubscribe,
} from 'firebase/database';
import { database } from '@services/firebase';
import type { Session, SessionStatus } from '../types';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;

export function generateSessionCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return code;
}

export async function createSession(code: string): Promise<void> {
  const sessionRef = ref(database, `sessions/${code}`);
  const sessionData: Omit<Session, 'code' | 'role'> = {
    status: 'waiting',
    attendantConnected: true,
    clientConnected: false,
    createdAt: Date.now(),
  };
  await set(sessionRef, sessionData);
}

export async function joinSession(code: string): Promise<Session> {
  const sessionRef = ref(database, `sessions/${code}`);
  const snapshot = await get(sessionRef);

  if (!snapshot.exists()) {
    throw new Error('Sessão não encontrada.');
  }

  const data = snapshot.val() as Omit<Session, 'code' | 'role'>;

  if (data.status !== 'waiting') {
    throw new Error('Esta sessão não está disponível para conexão.');
  }

  await update(sessionRef, {
    clientConnected: true,
    status: 'connected',
  });

  return {
    ...data,
    code,
    role: null,
    clientConnected: true,
    status: 'connected',
  };
}

export async function updateSessionStatus(
  code: string,
  status: SessionStatus,
): Promise<void> {
  const sessionRef = ref(database, `sessions/${code}`);
  await update(sessionRef, { status });
}

export function listenToSession(
  code: string,
  callback: (session: Session | null) => void,
): Unsubscribe {
  const sessionRef = ref(database, `sessions/${code}`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const data = snapshot.val() as Omit<Session, 'code' | 'role'>;
    callback({
      ...data,
      code,
      role: null,
    });
  });

  return unsubscribe;
}

export async function endSession(code: string): Promise<void> {
  const sessionRef = ref(database, `sessions/${code}`);
  await update(sessionRef, {
    status: 'ended',
    attendantConnected: false,
    clientConnected: false,
  });
}
