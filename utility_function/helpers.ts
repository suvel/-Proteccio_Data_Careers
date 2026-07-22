import { Cell, DataType, Header, ParsedFile, Row, TopValueEntry } from './types';
import { MISSING_DATA_VALUES } from './constants/patterns';
import { ValidationErrorCode } from './constants/errorCodes';
import { ValidationError } from './errors';

const NULL_VALUE_KEY = '\0null';

const BIAS_THRESHOLD = 0.7;

/**
 * Validates that a ParsedFile has the minimal shape every check function relies on.
 * @example
 * validateParsedFile({ headers: [], rows: [], colAttributes: [] }) // no-op, valid shape
 * @example
 * validateParsedFile(null) // throws ValidationError(ValidationErrorCode.INVALID_PARSED_FILE)
 */
export function validateParsedFile(parsedFile: ParsedFile): void {
  if (typeof parsedFile !== 'object' || parsedFile === null) {
    throw new ValidationError(ValidationErrorCode.INVALID_PARSED_FILE);
  }
  if (!Array.isArray(parsedFile.headers)) {
    throw new ValidationError(ValidationErrorCode.INVALID_HEADERS);
  }
  if (!Array.isArray(parsedFile.rows)) {
    throw new ValidationError(ValidationErrorCode.INVALID_ROWS);
  }
}

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
  if ((dataType === 'Date' || dataType === 'DateTime') && value instanceof Date) {
    return String(value.getFullYear());
  }
  if (dataType === 'Time' && value instanceof Date) {
    return value.getHours() < 12 ? 'AM' : 'PM';
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
export function getNonMissingCells(
  header: Header,
  rows: Row[],
): { cells: Cell[]; nonMissing: Cell[] } {
  const cells = rows
    .map((row) => row[header.header_id])
    .filter((cell): cell is Cell => Boolean(cell));
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
  const numbers = nonMissing
    .filter((cell) => typeof cell.value === 'number')
    .map((cell) => cell.value as number);
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
export function computeDateRangeAttributes(nonMissing: Cell[]): {
  isDateRangeComplete?: boolean;
  missingYears?: number[];
} {
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

/**
 * Maps a cell's value to a stable string key for identity/grouping purposes.
 * @example
 * cellValueKey({ value: new Date('2022-01-01'), data_type: 'Date' })
 * // => '1640995200000'
 */
function cellValueKey(cell: Cell): string {
  if (isMissingData(cell.value)) return NULL_VALUE_KEY;
  if (cell.value instanceof Date) return String(cell.value.getTime());
  return String(cell.value);
}

/**
 * Computes the min, max, and average of a Number column's non-missing values.
 * @example
 * computeNumericRangeAttributes([
 *   { value: 2, data_type: 'Number' },
 *   { value: 4, data_type: 'Number' },
 *   { value: 6, data_type: 'Number' },
 * ])
 * // => { min_value: 2, max_value: 6, average_value: 4 }
 */
export function computeNumericRangeAttributes(nonMissing: Cell[]): {
  min_value?: number;
  max_value?: number;
  average_value?: number;
} {
  const numbers = nonMissing
    .filter((cell) => typeof cell.value === 'number')
    .map((cell) => cell.value as number);
  if (numbers.length === 0) return {};
  return {
    min_value: Math.min(...numbers),
    max_value: Math.max(...numbers),
    average_value: numbers.reduce((sum, value) => sum + value, 0) / numbers.length,
  };
}

/**
 * Finds the most frequent distinct values in a column's non-missing cells (top 3 by
 * default). If no value repeats at all, returns every distinct value instead of
 * truncating to topN. Ties in frequency are broken by first-seen order.
 * @example
 * computeTopValues([
 *   { value: 'a', data_type: 'String' },
 *   { value: 'b', data_type: 'String' },
 *   { value: 'a', data_type: 'String' },
 * ])
 * // => [{ value: 'a', count: 2 }, { value: 'b', count: 1 }]
 */
export function computeTopValues(nonMissing: Cell[], topN = 3): TopValueEntry[] {
  if (nonMissing.length === 0) return [];

  const order: string[] = [];
  const counts = new Map<string, number>();
  const representative = new Map<string, Cell['value']>();

  for (const cell of nonMissing) {
    const key = cellValueKey(cell);
    if (!counts.has(key)) {
      counts.set(key, 0);
      representative.set(key, cell.value);
      order.push(key);
    }
    counts.set(key, counts.get(key)! + 1);
  }

  const allUnique = counts.size === nonMissing.length;
  const entries: TopValueEntry[] = order.map((key) => ({
    value: representative.get(key)!,
    count: counts.get(key)!,
  }));

  entries.sort((a, b) => b.count - a.count);

  return allUnique ? entries : entries.slice(0, topN);
}

/**
 * Assigns each distinct value in a column an ordinal ID based on first-seen order,
 * formatted as "C{colIndex}_{ordinal}".
 * @example
 * buildColumnValueIds(1, [
 *   { value: 'a', data_type: 'String' },
 *   { value: 'b', data_type: 'String' },
 *   { value: 'a', data_type: 'String' },
 * ])
 * // => ['C1_1', 'C1_2', 'C1_1']
 */
export function buildColumnValueIds(colIndex: number, cells: Cell[]): string[] {
  const ordinals = new Map<string, number>();
  return cells.map((cell) => {
    const key = cellValueKey(cell);
    if (!ordinals.has(key)) ordinals.set(key, ordinals.size + 1);
    return `C${colIndex}_${ordinals.get(key)}`;
  });
}
