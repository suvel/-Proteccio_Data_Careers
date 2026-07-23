import { Badge, Card, SimpleGrid, Stack, Text } from '@mantine/core';
import { formatCellValue, getDisplayedTopValues, getMostRepeatingEntry } from './ResultTable';
import type { ColumnAttributes, Header } from '../types';

interface ColumnStatsGridProps {
  headers: Header[];
  colAttributes: ColumnAttributes[];
}

function scoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

export function ColumnStatsGrid({ headers, colAttributes }: ColumnStatsGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
      {colAttributes.map((attr) => {
        const label =
          headers.find((h) => h.header_id === attr.header_id)?.header_label ?? attr.header_id;
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
              <Badge color={scoreColor(attr.qualityScore)} size="xs">
                Quality: {attr?.qualityScore?.toFixed(0)}%
              </Badge>
              <Badge color={scoreColor(attr.consistencyScore)} size="xs">
                Consistency: {attr?.consistencyScore?.toFixed(0)}%
              </Badge>
              {attr.standard_deviation !== undefined && (
                <Text size="xs" c="dimmed">
                  Std dev: {attr.standard_deviation.toFixed(2)}
                </Text>
              )}
              {mostRepeating && (
                <Badge color="grape" size="xs">
                  Most repeating: {formatCellValue(mostRepeating.value, attr.data_type)} (
                  {mostRepeating.count})
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
                  Min: {attr.min_value} · Max: {attr.max_value} · Avg:{' '}
                  {attr.average_value?.toFixed(2)}
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
  );
}
