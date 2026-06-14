import {
  ref,
  push,
  set,
  update,
  remove,
  onValue,
} from 'firebase/database';
import { database } from '@services/firebase';
import type { Command } from '../types';

export async function sendCommand(
  sessionCode: string,
  command: Omit<Command, 'id' | 'sentAt' | 'acknowledgedAt'>,
): Promise<string> {
  const commandsRef = ref(database, `sessions/${sessionCode}/commands`);
  const newRef = push(commandsRef);

  await set(newRef, {
    ...command,
    sentAt: Date.now(),
    acknowledgedAt: null,
  });

  return newRef.key as string;
}

export async function acknowledgeCommand(
  sessionCode: string,
  commandId: string,
): Promise<void> {
  const commandRef = ref(
    database,
    `sessions/${sessionCode}/commands/${commandId}`,
  );
  await update(commandRef, { acknowledgedAt: Date.now() });
}

export function listenToPendingCommand(
  sessionCode: string,
  callback: (command: Command | null) => void,
): () => void {
  const commandsRef = ref(database, `sessions/${sessionCode}/commands`);

  const unsubscribe = onValue(commandsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const data = snapshot.val() as Record<string, Omit<Command, 'id'>>;
    const commands = Object.entries(data).map(([id, value]) => ({
      id,
      ...value,
    }));

    const pending = commands
      .filter((c) => c.acknowledgedAt == null)
      .sort((a, b) => b.sentAt - a.sentAt)[0];

    callback(pending ?? null);
  });

  return unsubscribe;
}

export async function clearCommands(sessionCode: string): Promise<void> {
  const commandsRef = ref(database, `sessions/${sessionCode}/commands`);
  await remove(commandsRef);
}
