import { Alert, Badge, Group, Stack, Table, Text } from '@mantine/core';
import type { ParsedFile } from '../types';

interface ResultTableProps {
  result: ParsedFile;
}

function formatValue(value: string | number | Date | null): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export function ResultTable({ result }: ResultTableProps) {
  const { headers, rows, colAttributes, duplicateRows } = result;

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
          {rows.map((row, rowIndex) => (
            <Table.Tr key={rowIndex}>
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

      <Group gap="xs">
        {colAttributes.map((attr) => {
          const label = headers.find((h) => h.header_id === attr.header_id)?.header_label ?? attr.header_id;
          return (
            <Group key={attr.header_id} gap={4}>
              <Text size="sm" c="dimmed">
                {label}:
              </Text>
              {attr.isBiased && (
                <Badge color="grape" size="xs">
                  biased
                </Badge>
              )}
              {attr.isDateRangeComplete === false && (
                <Badge color="blue" size="xs">
                  incomplete date range
                </Badge>
              )}
            </Group>
          );
        })}
      </Group>

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
