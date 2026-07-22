import { useState } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';

interface TableTitlePromptModalProps {
  opened: boolean;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}

export function TableTitlePromptModal({ opened, onConfirm, onCancel }: TableTitlePromptModalProps) {
  const [title, setTitle] = useState('');

  const handleConfirm = () => {
    onConfirm(title.trim());
    setTitle('');
  };

  const handleCancel = () => {
    setTitle('');
    onCancel();
  };

  return (
    <Modal opened={opened} onClose={handleCancel} title="Store table">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Give this table a title so you can find it later.
        </Text>
        <TextInput
          label="Title"
          placeholder="e.g. Q1 customer export"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          data-autofocus
          data-testid="store-title-input"
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={handleCancel} data-testid="store-cancel-btn">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={title.trim().length === 0}
            data-testid="store-confirm-btn"
          >
            Store
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
