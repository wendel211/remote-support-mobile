import React from 'react';
import { renderWithProviders } from '@test/test-utils';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders visible role label', async () => {
    const { getByText } = await renderWithProviders(<TypingIndicator visible role="attendant" />);
    expect(getByText('Atendente está digitando...')).toBeTruthy();
  });

  it('renders nothing when hidden or system role', async () => {
    const hidden = await renderWithProviders(<TypingIndicator visible={false} role="client" />);
    expect(hidden.queryByText('Cliente está digitando...')).toBeNull();

    const system = await renderWithProviders(<TypingIndicator visible role="system" />);
    expect(system.toJSON()).toBeNull();
  });
});
