import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@test/test-utils';
import { ScreenshotButton } from './ScreenshotButton';

describe('ScreenshotButton', () => {
  it('requests screenshot when enabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithProviders(
      <ScreenshotButton isLoading={false} onPress={onPress} />,
    );

    fireEvent.press(getByText('Solicitar captura da tela do app'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows loading label', async () => {
    const { getByText } = await renderWithProviders(
      <ScreenshotButton isLoading onPress={jest.fn()} />,
    );

    expect(getByText('Solicitando...')).toBeTruthy();
  });
});
