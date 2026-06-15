import React from 'react';
import { Pressable } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { renderWithProviders } from '@test/test-utils';
import { CommandPicker } from './CommandPicker';
import { Text, useTheme } from '@shared/ui';

describe('CommandPicker', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalOS,
    });
  });

  it('sends regular commands', async () => {
    const onSend = jest.fn();
    const { getByText } = await renderWithProviders(
      <CommandPicker sessionCode="ABC123" onSend={onSend} />,
    );

    await fireEvent.press(getByText('Configurações'));

    expect(onSend).toHaveBeenCalledWith({
      type: 'OPEN_SETTINGS',
      label: 'Configurações',
    });
  });

  it('shows url input and sends normalized url', async () => {
    const onSend = jest.fn();
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <CommandPicker sessionCode="ABC123" onSend={onSend} />,
    );

    await fireEvent.press(getByText('Abrir URL'));
    await fireEvent.changeText(getByPlaceholderText('https://exemplo.com'), 'example.com');
    await fireEvent.press(getByText('Confirmar'));

    expect(onSend).toHaveBeenCalledWith({
      type: 'NAVIGATE_URL',
      label: 'Navegar para URL',
      payload: { url: 'https://example.com' },
    });
  });

  it('cancels url input without sending', async () => {
    const onSend = jest.fn();
    const { getByText, queryByText } = await renderWithProviders(
      <CommandPicker sessionCode="ABC123" onSend={onSend} />,
    );

    await fireEvent.press(getByText('Abrir URL'));
    await fireEvent.press(getByText('Cancelar'));

    expect(onSend).not.toHaveBeenCalled();
    expect(queryByText('URL de destino')).toBeNull();
  });

  it('does not send empty url values', async () => {
    const onSend = jest.fn();
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <CommandPicker sessionCode="ABC123" onSend={onSend} />,
    );

    await fireEvent.press(getByText('Abrir URL'));
    await fireEvent.changeText(getByPlaceholderText('https://exemplo.com'), '   ');
    await fireEvent.press(getByText('Confirmar'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('uses Alert.prompt on iOS and sends typed url', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
    const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(
      (_title, _message, callback) => {
        if (typeof callback === 'function') {
          callback('https://expo.dev');
        }
      },
    );
    const onSend = jest.fn();
    const { getByText } = await renderWithProviders(
      <CommandPicker sessionCode="ABC123" onSend={onSend} />,
    );

    await fireEvent.press(getByText('Abrir URL'));

    expect(prompt).toHaveBeenCalled();
    expect(onSend).toHaveBeenCalledWith({
      type: 'NAVIGATE_URL',
      label: 'Navegar para URL',
      payload: { url: 'https://expo.dev' },
    });
  });

  it('ignores empty iOS prompt values', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });
    jest.spyOn(Alert, 'prompt').mockImplementation(
      (_title, _message, callback) => {
        if (typeof callback === 'function') {
          callback('');
        }
      },
    );
    const onSend = jest.fn();
    const { getByText } = await renderWithProviders(
      <CommandPicker sessionCode="ABC123" onSend={onSend} />,
    );

    await fireEvent.press(getByText('Abrir URL'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('keeps already normalized urls and renders url input in light theme', async () => {
    const onSend = jest.fn();
    const { getByText, getByPlaceholderText } = await renderWithProviders(
      <LightThemeCommandPicker onSend={onSend} />,
    );

    await fireEvent.press(getByText('toggle theme'));
    await fireEvent.press(getByText('Abrir URL'));
    await fireEvent.changeText(getByPlaceholderText('https://exemplo.com'), 'https://example.com/path');
    await fireEvent.press(getByText('Confirmar'));

    expect(onSend).toHaveBeenCalledWith({
      type: 'NAVIGATE_URL',
      label: 'Navegar para URL',
      payload: { url: 'https://example.com/path' },
    });
  });
});

function LightThemeCommandPicker({
  onSend,
}: {
  onSend: React.ComponentProps<typeof CommandPicker>['onSend'];
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {isDark ? (
        <Pressable onPress={toggleTheme}>
          <Text>toggle theme</Text>
        </Pressable>
      ) : null}
      <CommandPicker sessionCode="ABC123" onSend={onSend} />
    </>
  );
}
