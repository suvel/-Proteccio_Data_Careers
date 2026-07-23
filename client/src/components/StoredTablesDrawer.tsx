import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Collapse,
  Drawer,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { IconDownload, IconTrash, IconEye, IconEyeClosed } from '@tabler/icons-react';
import { ColumnStatsGrid } from './ColumnStatsGrid';
import type { StoredTable } from '../types';

interface StoredTablesDrawerProps {
  opened: boolean;
  onClose: () => void;
  tables: StoredTable[];
  onLoad: (table: StoredTable) => void;
  onDelete: (id: string) => void;
  error: string | null;
}

export function StoredTablesDrawer({
  opened,
  onClose,
  tables,
  onLoad,
  onDelete,
  error,
}: StoredTablesDrawerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Stored tables"
      position="right"
      size="lg"
      data-testid="stored-tables-drawer"
    >
      {error && (
        <Alert
          color="red"
          title="Stored tables action failed"
          mb="md"
          data-testid="stored-tables-drawer-error-alert"
        >
          {error}
        </Alert>
      )}
      {tables.length === 0 ? (
        <Text size="sm" c="dimmed">
          No tables stored yet.
        </Text>
      ) : (
        <Stack gap="sm">
          {tables.map((table) => {
            const isExpanded = expandedIds.has(table.id);
            return (
              <div key={table.id}>
                <UnstyledButton
                  w="100%"
                  data-testid="stored-table-row"
                >
                  <Group justify="space-between">
                    <Text fw={600}>{table.title}</Text>
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        {table.tableObject.rows.length} rows
                      </Text>
                      <ActionIcon
                        variant="light"
                        color="blue"
                        aria-label="Load table"
                        data-testid="stored-table-load-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggle(table.id);
                        }}
                      >
                        {isExpanded ? <IconEyeClosed size={16} /> : <IconEye size={16} />}
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="blue"
                        aria-label="Load table"
                        data-testid="stored-table-load-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onLoad(table);
                        }}
                      >
                        <IconDownload size={16} /> {table.tableObject.download_count ?? '0'}
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        aria-label="Drop table"
                        data-testid="stored-table-drop-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(table.id);
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </UnstyledButton>
                <Collapse in={isExpanded}>
                  <Stack gap="xs" mt="sm">
                    <ColumnStatsGrid
                      headers={table.tableObject.headers}
                      colAttributes={table.tableObject.colAttributes}
                    />
                  </Stack>
                </Collapse>
              </div>
            );
          })}
        </Stack>
      )}
    </Drawer>
  );
}
