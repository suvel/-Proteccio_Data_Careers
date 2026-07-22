import { useState } from 'react';
import { Button, Checkbox, Modal, Stack, Text } from '@mantine/core';
import type { Header } from '../types';
import type { SensitiveColumnInfo } from '../utils/sensitiveColumns';

interface SensitiveColumnsModalProps {
  opened: boolean;
  columns: SensitiveColumnInfo[];
  headers: Header[];
  onConfirm: (confirmedIds: Set<string>) => void;
}

export function SensitiveColumnsModal({ opened, columns, headers, onConfirm }: SensitiveColumnsModalProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const toggle = (headerId: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(headerId);
      else next.delete(headerId);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(checkedIds);
    setCheckedIds(new Set());
  };

  return (
    <Modal opened={opened} onClose={handleConfirm} title="Confirm sensitive columns" closeOnClickOutside={false} closeOnEscape={false} withCloseButton={false}>
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          The following columns contain values that matched a sensitive-data pattern. Check any column
          you want tagged with the "sensitive" badge in the table.
        </Text>
        {columns.map(({ headerId, matchedPatterns }) => {
          const label = headers.find((h) => h.header_id === headerId)?.header_label ?? headerId;
          return (
            <Checkbox
              key={headerId}
              label={
                <>
                  {label}
                  {matchedPatterns.length > 0 && (
                    <Text component="span" size="xs" c="dimmed">
                      {' '}
                      sensitive pattern detected: {matchedPatterns.join(', ')}
                    </Text>
                  )}
                </>
              }
              checked={checkedIds.has(headerId)}
              onChange={(event) => toggle(headerId, event.currentTarget.checked)}
            />
          );
        })}
        <Button onClick={handleConfirm} mt="sm">
          Confirm
        </Button>
      </Stack>
    </Modal>
  );
}
