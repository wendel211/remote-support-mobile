import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@test/test-utils';
import { CommandModal } from './CommandModal';
import type { Command } from '../types';

function makeCommand(overrides: Partial<Command> = {}): Command {
  return {
    id: 'cmd1',
    type: 'OPEN_SETTINGS',
    label: 'Configurações',
    sentAt: 100,
    acknowledgedAt: null,
    ...overrides,
  };
}

describe('CommandModal', () => {
  it('renders nothing when there is no command', async () => {
    const { queryByText } = await renderWithProviders(
      <CommandModal command={null} onAcknowledge={jest.fn()} />,
    );

    expect(queryByText('Comando recebido')).toBeNull();
  });

  it('renders command description and acknowledges', async () => {
    const onAcknowledge = jest.fn();
    const { getByText } = await renderWithProviders(
      <CommandModal command={makeCommand()} onAcknowledge={onAcknowledge} />,
    );

    expect(getByText('Comando recebido')).toBeTruthy();
    expect(getByText('As configurações do dispositivo serão abertas no cliente.')).toBeTruthy();
    fireEvent.press(getByText('Entendido'));
    expect(onAcknowledge).toHaveBeenCalled();
  });

  it('renders url payload and device info command', async () => {
    const url = await renderWithProviders(
      <CommandModal
        command={makeCommand({
          type: 'NAVIGATE_URL',
          label: 'Abrir URL',
          payload: { url: 'https://example.com' },
        })}
        onAcknowledge={jest.fn()}
      />,
    );
    expect(url.getByText('https://example.com')).toBeTruthy();

    const info = await renderWithProviders(
      <CommandModal
        command={makeCommand({ type: 'SHOW_INFO', label: 'Informações' })}
        sessionCode="ABC123"
        onAcknowledge={jest.fn()}
      />,
    );
    expect(info.getByText('Perfil')).toBeTruthy();
    expect(info.getByText('ABC123')).toBeTruthy();
  });

  it('renders descriptions for restart and clear cache commands', async () => {
    const restart = await renderWithProviders(
      <CommandModal
        command={makeCommand({ type: 'RESTART_APP', label: 'Reiniciar app' })}
        onAcknowledge={jest.fn()}
      />,
    );
    expect(restart.getByText('O app será recarregado localmente no dispositivo do cliente.')).toBeTruthy();

    const clear = await renderWithProviders(
      <CommandModal
        command={makeCommand({ type: 'CLEAR_CACHE', label: 'Limpar cache' })}
        onAcknowledge={jest.fn()}
      />,
    );
    expect(clear.getByText('Mensagens em memória e capturas locais serão limpas no cliente.')).toBeTruthy();
  });
});
