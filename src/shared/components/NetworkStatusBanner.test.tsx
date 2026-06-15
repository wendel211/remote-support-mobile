import React from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { renderWithProviders } from '@test/test-utils';
import { NetworkStatusBanner } from './NetworkStatusBanner';

const mockUseNetInfo = useNetInfo as jest.Mock;

describe('NetworkStatusBanner', () => {
  beforeEach(() => {
    mockUseNetInfo.mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
    });
  });

  it('renders synchronized state when internet is reachable', async () => {
    const { getByText } = await renderWithProviders(
      <NetworkStatusBanner onlineLabel="Sessão ativa e sincronizada" />,
    );

    expect(getByText('Sessão ativa e sincronizada')).toBeTruthy();
  });

  it('renders offline state when internet is unavailable', async () => {
    mockUseNetInfo.mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { getByText } = await renderWithProviders(
      <NetworkStatusBanner offlineLabel="Sessão não sincronizada" />,
    );

    expect(getByText('Sessão não sincronizada')).toBeTruthy();
  });

  it('hides online state when requested', async () => {
    const { queryByText } = await renderWithProviders(
      <NetworkStatusBanner hideWhenOnline onlineLabel="Online" />,
    );

    expect(queryByText('Online')).toBeNull();
  });
});
