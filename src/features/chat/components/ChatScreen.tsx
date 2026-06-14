import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  sendMessage,
  listenToMessages,
  setTypingIndicator,
  listenToTyping,
} from '../services';
import {
  addMessage,
  setMessages,
  updateMessageStatus,
  setIsTyping,
} from '../store';
import type { ChatMessage, MessageRole } from '../types';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';

interface ChatScreenProps {
  sessionCode: string;
  currentRole: MessageRole;
}

export function ChatScreen({
  sessionCode,
  currentRole,
}: ChatScreenProps): React.JSX.Element {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.chat.messages);
  const isTyping = useAppSelector((state) => state.chat.isTyping);

  const oppositeRole: MessageRole =
    currentRole === 'attendant' ? 'client' : 'attendant';

  useEffect(() => {
    const unsubMessages = listenToMessages(
      sessionCode,
      (updatedMessages: ChatMessage[]) => {
        dispatch(setMessages(updatedMessages));
      },
    );

    const unsubTyping = listenToTyping(
      sessionCode,
      oppositeRole,
      (typing: boolean) => {
        dispatch(setIsTyping(typing));
      },
    );

    return () => {
      unsubMessages();
      unsubTyping();
    };
  }, [sessionCode, oppositeRole, dispatch]);

  const handleSend = useCallback(
    (text: string) => {
      const tempId = `temp_${Date.now()}`;
      const timestamp = Date.now();

      const messageData: ChatMessage = {
        id: tempId,
        sessionCode,
        text,
        role: currentRole,
        timestamp,
        status: 'sending',
      };

      dispatch(addMessage(messageData));

      const messageToSend: Omit<ChatMessage, 'id'> = {
        sessionCode,
        text,
        role: currentRole,
        timestamp,
        status: 'sent',
      };

      sendMessage(sessionCode, messageToSend)
        .then(() => {
          dispatch(
            updateMessageStatus({ id: tempId, status: 'sent' }),
          );
        })
        .catch(() => {
          dispatch(
            updateMessageStatus({ id: tempId, status: 'error' }),
          );
        });
    },
    [sessionCode, currentRole, dispatch],
  );

  const handleTypingChange = useCallback(
    (typing: boolean) => {
      void setTypingIndicator(sessionCode, currentRole, typing);
    },
    [sessionCode, currentRole],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatBubble message={item} currentRole={currentRole} />
    ),
    [currentRole],
  );

  const keyExtractor = useCallback(
    (item: ChatMessage) => item.id,
    [],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        style={styles.messagesList}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        contentContainerStyle={styles.messagesContent}
        ListHeaderComponent={
          <TypingIndicator visible={isTyping} role={oppositeRole} />
        }
      />
      <ChatInput
        onSend={handleSend}
        onTypingChange={handleTypingChange}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
});
