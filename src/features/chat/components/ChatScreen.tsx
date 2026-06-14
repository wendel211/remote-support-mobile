import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { FlatList, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Box, HStack, Text, VStack } from '@shared/ui';
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
  const pendingRequest = useAppSelector((state) => state.screenshot.pendingRequest);
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
          dispatch(updateMessageStatus({ id: tempId, status: 'sent' }));
        })
        .catch(() => {
          dispatch(updateMessageStatus({ id: tempId, status: 'error' }));
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

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <View className="flex-1 bg-background">
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
          <VStack space="md" className="px-4 py-2">
            {pendingRequest &&
              !pendingRequest.sentAt &&
              !pendingRequest.base64 &&
              !pendingRequest.error && (
                <Box className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 shadow-sm">
                  <HStack space="md" className="items-center">
                    <Box className="h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                      <MaterialCommunityIcons name="camera" size={20} color="#2563EB" />
                    </Box>
                    <VStack space="xs" className="flex-1">
                      <Text className="text-[15px] text-[#0F172A]" weight="bold">
                        Screenshot solicitado
                      </Text>
                      <Text className="text-[13px] text-[#64748B]">
                        {currentRole === 'client'
                          ? 'Enviando automaticamente uma captura da tela do app.'
                          : 'Aguardando envio da captura pelo cliente...'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            <TypingIndicator visible={isTyping} role={oppositeRole} />
          </VStack>
        }
      />
      <ChatInput
        onSend={handleSend}
        onTypingChange={handleTypingChange}
      />
    </View>
  );
}
