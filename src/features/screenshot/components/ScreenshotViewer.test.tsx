import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ScreenshotViewer } from './ScreenshotViewer';

describe('ScreenshotViewer', () => {
  it('renders nothing without image', async () => {
    const { toJSON } = await render(<ScreenshotViewer base64={null} onClose={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('renders received image and closes', async () => {
    const onClose = jest.fn();
    const { getByText, getByLabelText } = await render(
      <ScreenshotViewer base64="abc" onClose={onClose} />,
    );

    expect(getByText('Captura recebida')).toBeTruthy();
    fireEvent.press(getByLabelText('icon-close'));
    expect(onClose).toHaveBeenCalled();
  });
});
