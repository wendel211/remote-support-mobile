import React from 'react';
import { Pressable } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@test/test-utils';
import { ChatBubble } from './ChatBubble';
import type { ChatMessage } from '../types';
import { Text, useTheme } from '@shared/ui';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    sessionCode: 'ABC123',
    text: 'Mensagem',
    role: 'client',
    timestamp: new Date('2026-06-15T10:20:00Z').getTime(),
    status: 'sent',
    ...overrides,
  };
}

describe('ChatBubble', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders system messages', async () => {
    const { getByText } = await renderWithProviders(
      <ChatBubble message={makeMessage({ role: 'system', text: 'Sistema' })} currentRole="client" />,
    );

    expect(getByText('Sistema')).toBeTruthy();
  });

  it('renders own message status and time', async () => {
    const { getByText } = await renderWithProviders(
      <ChatBubble message={makeMessage({ role: 'client', status: 'sending' })} currentRole="client" />,
    );

    expect(getByText('Mensagem')).toBeTruthy();
    expect(getByText('...')).toBeTruthy();
  });

  it('renders sent and error status indicators', async () => {
    const sent = await renderWithProviders(
      <ChatBubble message={makeMessage({ role: 'client', status: 'sent' })} currentRole="client" />,
    );
    expect(sent.getByText('ok')).toBeTruthy();

    const error = await renderWithProviders(
      <ChatBubble message={makeMessage({ role: 'client', status: 'error' })} currentRole="client" />,
    );
    expect(error.getByText('erro')).toBeTruthy();
  });

  it('opens urls in webview route', async () => {
    const { getByText } = await renderWithProviders(
      <ChatBubble
        message={makeMessage({ text: 'https://example.com', role: 'attendant' })}
        currentRole="client"
      />,
    );

    fireEvent.press(getByText('https://example.com'));

    expect(mockNavigate).toHaveBeenCalledWith('WebView', { url: 'https://example.com' });
    expect(getByText('Abrir link')).toBeTruthy();
  });

  it('renders own url links with own bubble style path', async () => {
    const { getByText } = await renderWithProviders(
      <ChatBubble
        message={makeMessage({ text: 'https://openai.com', role: 'client' })}
        currentRole="client"
      />,
    );

    await fireEvent.press(getByText('https://openai.com'));

    expect(mockNavigate).toHaveBeenCalledWith('WebView', { url: 'https://openai.com' });
    expect(getByText('Abrir link')).toBeTruthy();
  });

  it('renders system messages in light theme branch', async () => {
    const { getByText } = await renderWithProviders(
      <LightThemeBubble
        message={makeMessage({ role: 'system', text: 'Aviso do sistema' })}
        currentRole="client"
      />,
    );

    await fireEvent.press(getByText('toggle theme'));

    expect(getByText('Aviso do sistema')).toBeTruthy();
  });

  it('renders other user urls in light theme branch', async () => {
    const { getByText } = await renderWithProviders(
      <LightThemeBubble
        message={makeMessage({ text: 'https://reactnative.dev', role: 'attendant' })}
        currentRole="client"
      />,
    );

    await fireEvent.press(getByText('toggle theme'));
    await fireEvent.press(getByText('https://reactnative.dev'));

    expect(mockNavigate).toHaveBeenCalledWith('WebView', { url: 'https://reactnative.dev' });
  });
});

function LightThemeBubble({
  message,
  currentRole,
}: {
  message: ChatMessage;
  currentRole: ChatMessage['role'];
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {isDark ? (
        <Pressable onPress={toggleTheme}>
          <Text>toggle theme</Text>
        </Pressable>
      ) : null}
      <ChatBubble message={message} currentRole={currentRole} />
    </>
  );
}
