import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const oppositeRole: MessageRole =
    currentRole === 'attendant' ? 'client' : 'attendant';

  const orderedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => {
        if (a.timestamp !== b.timestamp) {
          return a.timestamp - b.timestamp;
        }

        return a.id.localeCompare(b.id);
      }),
    [messages],
  );

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
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        className="flex-1"
        data={orderedMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 10 }}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        onContentSizeChange={() => {
          listRef.current?.scrollToEnd({ animated: true });
        }}
        onLayout={() => {
          listRef.current?.scrollToEnd({ animated: false });
        }}
        ListFooterComponent={
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
