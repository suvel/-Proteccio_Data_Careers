import { Cell, DataType, Header, Row } from './types';
import { MISSING_DATA_VALUES } from './constants/patterns';

const BIAS_THRESHOLD = 0.7;

export function isMissingData(value: Cell['value']): boolean {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed === '' || MISSING_DATA_VALUES.includes(trimmed);
}

/**
 * Picks the data type shared by the most cells in a column.
 * @example
 * mostCommonDataType([
 *   { value: 1, data_type: 'Number' },
 *   { value: 2, data_type: 'Number' },
 *   { value: 'x', data_type: 'String' },
 * ])
 * // => 'Number'
 */
export function mostCommonDataType(cells: Cell[]): DataType {
  const counts = new Map<DataType, number>();
  for (const cell of cells) counts.set(cell.data_type, (counts.get(cell.data_type) ?? 0) + 1);
  let majorityType: DataType = 'String';
  let majorityCount = -1;
  for (const [type, count] of counts) {
    if (count > majorityCount) {
      majorityType = type;
      majorityCount = count;
    }
  }
  return majorityType;
}

/**
 * Computes the population standard deviation of a set of numbers.
 * @example
 * standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])
 * // => 2
 */
export function standardDeviation(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Maps a cell's value to the bucket key used for bias detection:
 * sign for numbers, year for dates, exact value for strings.
 * @example
 * biasBucketKey('Number', -5)
 * // => 'negative'
 * @example
 * biasBucketKey('Date', new Date('2022-06-01'))
 * // => '2022'
 */
export function biasBucketKey(dataType: DataType, value: Cell['value']): string | null {
  if (dataType === 'Number' && typeof value === 'number') {
    return value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero';
  }
  if (dataType === 'Date' && value instanceof Date) {
    return String(value.getFullYear());
  }
  if (dataType === 'String' && typeof value === 'string') {
    return value;
  }
  return null;
}

/**
 * Splits a column's cells into all cells and the subset with non-missing values.
 * @example
 * getNonMissingCells(header, rows)
 * // => { cells: [...], nonMissing: [...] } // nonMissing excludes null/blank/"-" cells
 */
export function getNonMissingCells(header: Header, rows: Row[]): { cells: Cell[]; nonMissing: Cell[] } {
  const cells = rows.map((row) => row[header.header_id]).filter((cell): cell is Cell => Boolean(cell));
  const nonMissing = cells.filter((cell) => !isMissingData(cell.value));
  return { cells, nonMissing };
}

/**
 * Computes the standard deviation of a Number column's non-missing values.
 * @example
 * computeStandardDeviationForCells([
 *   { value: 2, data_type: 'Number' },
 *   { value: 4, data_type: 'Number' },
 * ])
 * // => 1
 */
export function computeStandardDeviationForCells(nonMissing: Cell[]): number | undefined {
  const numbers = nonMissing.filter((cell) => typeof cell.value === 'number').map((cell) => cell.value as number);
  return numbers.length > 0 ? standardDeviation(numbers) : undefined;
}

/**
 * Determines whether a column's non-missing values are skewed toward one bucket
 * (sign for numbers, year for dates, exact value for strings).
 * @example
 * computeBiasAttributes('Number', [
 *   { value: -1, data_type: 'Number' },
 *   { value: -2, data_type: 'Number' },
 *   { value: -3, data_type: 'Number' },
 *   { value: -4, data_type: 'Number' },
 *   { value: 5, data_type: 'Number' },
 * ])
 * // => { isBiased: true, biasedValue: 'negative' }
 */
export function computeBiasAttributes(
  dataType: DataType,
  nonMissing: Cell[],
): { isBiased: boolean; biasedValue?: string } {
  const bucketKeys = nonMissing
    .map((cell) => biasBucketKey(dataType, cell.value))
    .filter((key): key is string => key !== null);
  if (bucketKeys.length === 0) return { isBiased: false };

  const counts = new Map<string, number>();
  for (const key of bucketKeys) counts.set(key, (counts.get(key) ?? 0) + 1);
  let maxKey = '';
  let maxCount = 0;
  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxKey = key;
      maxCount = count;
    }
  }

  if (maxCount / bucketKeys.length >= BIAS_THRESHOLD) {
    return { isBiased: true, biasedValue: maxKey };
  }
  return { isBiased: false };
}

/**
 * Detects gaps in the year range covered by a Date column's non-missing values.
 * @example
 * computeDateRangeAttributes([
 *   { value: new Date('2020-01-01'), data_type: 'Date' },
 *   { value: new Date('2020-06-01'), data_type: 'Date' },
 *   { value: new Date('2022-01-01'), data_type: 'Date' },
 * ])
 * // => { isDateRangeComplete: false, missingYears: [2021] }
 */
export function computeDateRangeAttributes(
  nonMissing: Cell[],
): { isDateRangeComplete?: boolean; missingYears?: number[] } {
  const years = nonMissing
    .filter((cell) => cell.value instanceof Date)
    .map((cell) => (cell.value as Date).getFullYear());
  if (years.length === 0) return {};

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const presentYears = new Set(years);
  const missingYears: number[] = [];
  for (let year = minYear; year <= maxYear; year++) {
    if (!presentYears.has(year)) missingYears.push(year);
  }
  return { isDateRangeComplete: missingYears.length === 0, missingYears };
}
