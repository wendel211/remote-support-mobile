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
const PERMISSION_DENIED_MESSAGE =
  'Permissao negada no Firebase. Configure as regras do Realtime Database para permitir leitura e escrita em sessions.';

function normalizeFirebaseError(err: unknown, fallback: string): Error {
  if (err instanceof Error) {
    const message = err.message.toLowerCase();

    if (
      message.includes('permission_denied') ||
      message.includes('permission denied')
    ) {
      return new Error(PERMISSION_DENIED_MESSAGE);
    }

    return err;
  }

  return new Error(fallback);
}

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

  try {
    await set(sessionRef, sessionData);
  } catch (err: unknown) {
    throw normalizeFirebaseError(err, 'Erro ao criar sessao.');
  }
}

export async function joinSession(code: string): Promise<Session> {
  const sessionRef = ref(database, `sessions/${code}`);

  let snapshot;
  try {
    snapshot = await get(sessionRef);
  } catch (err: unknown) {
    throw normalizeFirebaseError(err, 'Erro ao buscar sessao.');
  }

  if (!snapshot.exists()) {
    throw new Error('Sessao nao encontrada.');
  }

  const data = snapshot.val() as Omit<Session, 'code' | 'role'>;

  if (data.status !== 'waiting') {
    throw new Error('Esta sessao nao esta disponivel para conexao.');
  }

  try {
    await update(sessionRef, {
      clientConnected: true,
      status: 'connected',
    });
  } catch (err: unknown) {
    throw normalizeFirebaseError(err, 'Erro ao entrar na sessao.');
  }

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

  try {
    await update(sessionRef, { status });
  } catch (err: unknown) {
    throw normalizeFirebaseError(err, 'Erro ao atualizar sessao.');
  }
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

  try {
    await update(sessionRef, {
      status: 'ended',
      attendantConnected: false,
      clientConnected: false,
    });
  } catch (err: unknown) {
    throw normalizeFirebaseError(err, 'Erro ao encerrar sessao.');
  }
}
