import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@test/test-utils';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends trimmed text and controls typing indicator', async () => {
    const onSend = jest.fn();
    const onTypingChange = jest.fn();
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <ChatInput onSend={onSend} onTypingChange={onTypingChange} />,
    );

    await fireEvent.changeText(getByPlaceholderText('Digite uma mensagem...'), '  Olá  ');
    expect(onTypingChange).toHaveBeenCalledWith(true);

    await fireEvent.press(getByText('Enviar'));

    await waitFor(() => expect(onSend).toHaveBeenCalledWith('Olá'));
    expect(onSend).toHaveBeenCalledWith('Olá');
  });

  it('stops typing after timeout and does not send empty messages', async () => {
    const onSend = jest.fn();
    const onTypingChange = jest.fn();
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <ChatInput onSend={onSend} onTypingChange={onTypingChange} />,
    );

    await fireEvent.changeText(getByPlaceholderText('Digite uma mensagem...'), 'Oi');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await fireEvent.changeText(getByPlaceholderText('Digite uma mensagem...'), '   ');
    await fireEvent.press(getByText('Enviar'));

    expect(onTypingChange).toHaveBeenCalledWith(false);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send while disabled', async () => {
    const onSend = jest.fn();
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <ChatInput onSend={onSend} onTypingChange={jest.fn()} disabled />,
    );

    await fireEvent.changeText(getByPlaceholderText('Digite uma mensagem...'), 'Oi');
    await fireEvent.press(getByText('Enviar'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send an empty disabled input', async () => {
    const onSend = jest.fn();
    const { getByText } = await renderWithProviders(
      <ChatInput onSend={onSend} onTypingChange={jest.fn()} disabled />,
    );

    await fireEvent.press(getByText('Enviar'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not mark typing for empty text changes', async () => {
    const onTypingChange = jest.fn();
    const { getByPlaceholderText } = await renderWithProviders(
      <ChatInput onSend={jest.fn()} onTypingChange={onTypingChange} />,
    );

    await fireEvent.changeText(getByPlaceholderText('Digite uma mensagem...'), '');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTypingChange).not.toHaveBeenCalledWith(true);
  });

  it('clears pending typing timeout on unmount', async () => {
    const onTypingChange = jest.fn();
    const screen = await renderWithProviders(
      <ChatInput onSend={jest.fn()} onTypingChange={onTypingChange} />,
    );

    await fireEvent.changeText(screen.getByPlaceholderText('Digite uma mensagem...'), 'Oi');
    await act(async () => {
      screen.unmount();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTypingChange).toHaveBeenCalledTimes(1);
    expect(onTypingChange).toHaveBeenCalledWith(true);
  });

  it('sends after typing timeout has already stopped the indicator', async () => {
    const onSend = jest.fn();
    const onTypingChange = jest.fn();
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <ChatInput onSend={onSend} onTypingChange={onTypingChange} />,
    );

    await fireEvent.changeText(getByPlaceholderText('Digite uma mensagem...'), 'Tudo certo');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await fireEvent.press(getByText('Enviar'));

    expect(onTypingChange).toHaveBeenCalledWith(false);
    expect(onSend).toHaveBeenCalledWith('Tudo certo');
  });
});
