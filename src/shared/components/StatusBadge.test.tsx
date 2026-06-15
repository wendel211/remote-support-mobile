import React from 'react';
import { Pressable } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@test/test-utils';
import { StatusBadge } from './StatusBadge';
import { Text, useTheme } from '@shared/ui';

describe('StatusBadge', () => {
  it.each([
    ['waiting', 'Aguardando'],
    ['connected', 'Conectado'],
    ['ended', 'Encerrado'],
    ['idle', 'Inativo'],
    ['offline', 'Offline'],
  ] as const)('renders label for %s status', async (status, label) => {
    const { getByText } = await renderWithProviders(<StatusBadge status={status} />);
    expect(getByText(label)).toBeTruthy();
  });

  it('renders a custom label when provided', async () => {
    const { getByText, queryByText } = await renderWithProviders(
      <StatusBadge status="offline" label="Aguardando conexão" />,
    );

    expect(getByText('Aguardando conexão')).toBeTruthy();
    expect(queryByText('Offline')).toBeNull();
  });
});

function LightModeStatusBadge() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {isDark ? (
        <Pressable onPress={toggleTheme}>
          <Text>toggle theme</Text>
        </Pressable>
      ) : null}
      <StatusBadge status="connected" />
      <StatusBadge status="idle" />
    </>
  );
}

describe('StatusBadge theme branches', () => {
  it('renders in light mode too', async () => {
    const { getByText } = await renderWithProviders(<LightModeStatusBadge />);
    await fireEvent.press(getByText('toggle theme'));
    expect(getByText('Conectado')).toBeTruthy();
    expect(getByText('Inativo')).toBeTruthy();
  });
});
