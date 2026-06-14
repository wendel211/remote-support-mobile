import {
  ref,
  push,
  set,
  onValue,
  type Unsubscribe,
} from 'firebase/database';
import { database } from '@services/firebase';
import type { ChatMessage, MessageRole } from '../types';

export async function sendMessage(
  sessionCode: string,
  message: Omit<ChatMessage, 'id'>,
): Promise<string> {
  const messagesRef = ref(database, `sessions/${sessionCode}/messages`);
  const newMessageRef = push(messagesRef);
  const id = newMessageRef.key as string;

  await set(newMessageRef, {
    sessionCode: message.sessionCode,
    text: message.text,
    role: message.role,
    timestamp: message.timestamp,
    status: message.status,
  });

  return id;
}

interface FirebaseMessageData {
  sessionCode: string;
  text: string;
  role: MessageRole;
  timestamp: number;
  status: ChatMessage['status'];
}

export function listenToMessages(
  sessionCode: string,
  callback: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const messagesRef = ref(database, `sessions/${sessionCode}/messages`);

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val() as Record<string, FirebaseMessageData>;
    const messages: ChatMessage[] = Object.entries(data)
      .map(([id, msg]) => ({
        id,
        sessionCode: msg.sessionCode,
        text: msg.text,
        role: msg.role,
        timestamp: msg.timestamp,
        status: msg.status,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    callback(messages);
  });

  return unsubscribe;
}

export async function setTypingIndicator(
  sessionCode: string,
  role: MessageRole,
  isTyping: boolean,
): Promise<void> {
  const typingRef = ref(database, `sessions/${sessionCode}/typing/${role}`);
  await set(typingRef, isTyping);
}

export function listenToTyping(
  sessionCode: string,
  role: MessageRole,
  callback: (isTyping: boolean) => void,
): Unsubscribe {
  const typingRef = ref(database, `sessions/${sessionCode}/typing/${role}`);

  const unsubscribe = onValue(typingRef, (snapshot) => {
    const value = snapshot.val();
    callback(typeof value === 'boolean' ? value : false);
  });

  return unsubscribe;
}
