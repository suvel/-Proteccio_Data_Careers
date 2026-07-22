import { useState } from 'react';
import { Collapse, Drawer, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { ColumnStatsGrid } from './ColumnStatsGrid';
import type { StoredTable } from '../types';

interface StoredTablesDrawerProps {
  opened: boolean;
  onClose: () => void;
  tables: StoredTable[];
}

export function StoredTablesDrawer({ opened, onClose, tables }: StoredTablesDrawerProps) {
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
    <Drawer opened={opened} onClose={onClose} title="Stored tables" position="right" size="lg">
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
                <UnstyledButton onClick={() => toggle(index)} w="100%">
                  <Group justify="space-between">
                    <Text fw={600}>{table.title}</Text>
                    <Text size="sm" c="dimmed">
                      {table.tableObject.rows.length} rows · {isExpanded ? 'hide' : 'show'} stats
                    </Text>
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
