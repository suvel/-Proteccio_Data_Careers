import { useState } from 'react';
import { ActionIcon, Collapse, Drawer, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconDownload, IconTrash } from '@tabler/icons-react';
import { ColumnStatsGrid } from './ColumnStatsGrid';
import type { StoredTable } from '../types';

interface StoredTablesDrawerProps {
  opened: boolean;
  onClose: () => void;
  tables: StoredTable[];
  onLoad: (table: StoredTable) => void;
  onDelete: (index: number) => void;
}

export function StoredTablesDrawer({
  opened,
  onClose,
  tables,
  onLoad,
  onDelete,
}: StoredTablesDrawerProps) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
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
      {tables.length === 0 ? (
        <Text size="sm" c="dimmed">
          No tables stored yet.
        </Text>
      ) : (
        <Stack gap="sm">
          {tables.map((table, index) => {
            const isExpanded = expandedIndices.has(index);
            return (
              <div key={`${table.title}-${index}`}>
                <UnstyledButton onClick={() => toggle(index)} w="100%" data-testid="stored-table-row">
                  <Group justify="space-between">
                    <Text fw={600}>{table.title}</Text>
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        {table.tableObject.rows.length} rows · {isExpanded ? 'hide' : 'show'} stats
                      </Text>
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
                        <IconDownload size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        aria-label="Drop table"
                        data-testid="stored-table-drop-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(index);
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
