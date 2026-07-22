import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Group, Pagination, Select, SimpleGrid, Stack, Table, Text } from '@mantine/core';
import type { ParsedFile } from '../types';

interface ResultTableProps {
  result: ParsedFile;
}

const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

function formatValue(value: string | number | Date | null): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export function ResultTable({ result }: ResultTableProps) {
  const { headers, rows, colAttributes, duplicateRows } = result;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setPage(1);
  }, [result]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const startIndex = (page - 1) * pageSize;

  const visibleRows = useMemo(
    () => rows.slice(startIndex, startIndex + pageSize),
    [rows, startIndex, pageSize],
  );

  return (
    <Stack mt="lg">
      <Table striped withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
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
          {visibleRows.map((row, rowIndex) => (
            <Table.Tr key={startIndex + rowIndex}>
              {headers.map((header) => {
                const cell = row[header.header_id];
                return (
                  <Table.Td key={header.header_id}>
                    <Group gap="xs" wrap="nowrap">
                      <Text>{formatValue(cell?.value ?? null)}</Text>
                      {cell?.sensitive_data && (
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
          ))}
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

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
        {colAttributes.map((attr) => {
          const label = headers.find((h) => h.header_id === attr.header_id)?.header_label ?? attr.header_id;
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
                {attr.isBiased && (
                  <Badge color="grape" size="xs">
                    biased{attr.biasedValue ? `: ${attr.biasedValue}` : ''}
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
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>

      {duplicateRows && Object.keys(duplicateRows).length > 0 && (
        <Alert color="orange" title="Duplicate rows detected">
          {Object.entries(duplicateRows).map(([fingerprint, indices]) => (
            <Text size="sm" key={fingerprint}>
              Rows {indices.join(', ')} are duplicates of each other
            </Text>
          ))}
        </Alert>
      )}
    </Stack>
  );
}
