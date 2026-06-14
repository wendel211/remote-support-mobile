import React from 'react';
import { Modal, Image } from 'react-native';
import { Box, Button, ButtonText } from '@shared/ui';

interface ScreenshotViewerProps {
  base64: string | null;
  onClose: () => void;
}

export function ScreenshotViewer({
  base64,
  onClose,
}: ScreenshotViewerProps): React.JSX.Element {
  const visible = base64 !== null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Box className="flex-1 items-center justify-center bg-black/80 px-5">
        <Box className="w-full rounded-panel bg-slate-900 p-4">
          {base64 ? (
            <Image
              source={{ uri: `data:image/jpg;base64,${base64}` }}
              className="h-[450px] w-full rounded-ui"
              resizeMode="contain"
            />
          ) : null}
          <Button className="mt-4" tone="danger" onPress={onClose}>
            <ButtonText tone="danger">Fechar</ButtonText>
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
