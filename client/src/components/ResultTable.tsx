import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  Collapse,
  Group,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { Cell, ColumnAttributes, ParsedFile, TopValueEntry } from '../types';

interface ResultTableProps {
  result: ParsedFile;
  confirmedSensitiveIds?: Set<string>;
}

const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

export function formatCellValue(value: Cell['value'] | undefined, data_type: Cell['data_type']): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    if (data_type === 'Time') return value.toLocaleTimeString();
    if (data_type === 'DateTime') return value.toLocaleString();
    return value.toLocaleDateString();
  }
  return String(value);
}

export function formatValue(cell: Cell | undefined): string {
  if (!cell) return '';
  return formatCellValue(cell.value, cell.data_type);
}

export function getMostRepeatingEntry(
  attr: Pick<ColumnAttributes, 'data_type' | 'topValues'>,
): TopValueEntry | null {
  if (attr.data_type === 'Number') return null;
  const topValues = attr.topValues ?? [];
  if (topValues.length <= 1) return null;
  return topValues[0].count > 1 ? topValues[0] : null;
}

export function getDisplayedTopValues(attr: Pick<ColumnAttributes, 'topValues'>): TopValueEntry[] {
  return (attr.topValues ?? []).slice(0, 3);
}

export function ResultTable({ result, confirmedSensitiveIds = new Set() }: ResultTableProps) {
  const { headers, rows, colAttributes, duplicateRows } = result;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statsOpened, { toggle: toggleStats }] = useDisclosure(true);

  useEffect(() => {
    setPage(1);
  }, [result]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const startIndex = (page - 1) * pageSize;

  const visibleRows = useMemo(
    () => rows.slice(startIndex, startIndex + pageSize),
    [rows, startIndex, pageSize],
  );

  const duplicateRowIndices = useMemo(() => {
    const indices = new Set<number>();
    if (duplicateRows) {
      for (const rowIdxs of Object.values(duplicateRows)) {
        rowIdxs.forEach((i) => indices.add(i));
      }
    }
    return indices;
  }, [duplicateRows]);

  return (
    <Stack mt="lg">
      <Card withBorder padding="sm">
        <UnstyledButton onClick={toggleStats}>
          <Group justify="space-between">
            <Text fw={600}>Column stats</Text>
            <Text size="sm" c="dimmed">
              {statsOpened ? 'hide' : 'show'}
            </Text>
          </Group>
        </UnstyledButton>
        <Collapse in={statsOpened}>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm" mt="sm">
            {colAttributes.map((attr) => {
              const label = headers.find((h) => h.header_id === attr.header_id)?.header_label ?? attr.header_id;
              const mostRepeating = getMostRepeatingEntry(attr);
              const displayedTopValues = getDisplayedTopValues(attr);
              return (
                <Card key={attr.header_id} withBorder padding="sm">
                  <Stack gap={4}>
                    <Text fw={600} size="sm">
                      {label}
                    </Text>
                    <Badge color="gray" size="xs" variant="light">
                      {attr.data_type}
                    </Badge>
                    {attr.standard_deviation !== undefined && (
                      <Text size="xs" c="dimmed">
                        Std dev: {attr.standard_deviation.toFixed(2)}
                      </Text>
                    )}
                    {mostRepeating && (
                      <Badge color="grape" size="xs">
                        Most repeating: {formatCellValue(mostRepeating.value, attr.data_type)} ({mostRepeating.count})
                      </Badge>
                    )}
                    {attr.isDateRangeComplete === false && (
                      <Badge color="blue" size="xs">
                        incomplete date range
                      </Badge>
                    )}
                    {attr.missingYears && attr.missingYears.length > 0 && (
                      <Text size="xs" c="dimmed">
                        Missing years: {attr.missingYears.join(', ')}
                      </Text>
                    )}
                    {attr.min_value !== undefined && (
                      <Text size="xs" c="dimmed">
                        Min: {attr.min_value} · Max: {attr.max_value} · Avg: {attr.average_value?.toFixed(2)}
                      </Text>
                    )}
                    {displayedTopValues.length > 0 && (
                      <Stack gap={2}>
                        <Text size="xs" fw={600}>
                          Top #3 values
                        </Text>
                        {displayedTopValues.map((tv, i) => (
                          <Text size="xs" c="dimmed" key={i}>
                            {formatCellValue(tv.value, attr.data_type)} ({tv.count})
                          </Text>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        </Collapse>
      </Card>

      <Table striped withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            {headers.map((header) => (
              <Table.Th key={header.header_id}>
                <Group gap="xs" wrap="nowrap">
                  <Text fw={600}>{header.header_label}</Text>
                  {header.isDuplicateName && (
                    <Badge color="orange" size="xs">
                      duplicate name
                    </Badge>
                  )}
                </Group>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visibleRows.map((row, rowIndex) => {
            const absoluteIndex = startIndex + rowIndex;
            const isDuplicate = duplicateRowIndices.has(absoluteIndex);
            return (
              <Table.Tr
                key={absoluteIndex}
                style={isDuplicate ? { backgroundColor: '#fd7e141a', color: 'var(--mantine-color-orange-light-color)' } : undefined}
              >
                <Table.Td>{absoluteIndex + 1}</Table.Td>
                {headers.map((header) => {
                  const cell = row[header.header_id];
                  return (
                    <Table.Td key={header.header_id}>
                      <Group gap="xs" wrap="nowrap">
                        <Text>{formatValue(cell)}</Text>
                        {cell?.sensitive_data && confirmedSensitiveIds.has(header.header_id) && (
                          <Badge color="red" size="xs">
                            sensitive
                          </Badge>
                        )}
                        {cell?.missing_data && (
                          <Badge color="yellow" size="xs">
                            missing
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      <Group justify="space-between" wrap="wrap">
        <Text size="sm" c="dimmed">
          Showing {rows.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, rows.length)} of{' '}
          {rows.length} rows
        </Text>
        <Group gap="sm">
          <Select
            data={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onChange={(value) => {
              setPageSize(Number(value ?? PAGE_SIZE_OPTIONS[1]));
              setPage(1);
            }}
            w={90}
            allowDeselect={false}
          />
          <Pagination total={totalPages} value={page} onChange={setPage} />
        </Group>
      </Group>

      {duplicateRows && Object.keys(duplicateRows).length > 0 && (
        <Alert color="orange" title="Duplicate rows detected">
          {Object.entries(duplicateRows).map(([fingerprint, indices]) => (
            <Text size="sm" key={fingerprint}>
              Rows {indices.map((i) => i + 1).join(', ')} are duplicates of each other
            </Text>
          ))}
        </Alert>
      )}
    </Stack>
  );
}
