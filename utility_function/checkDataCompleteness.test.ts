import * as path from 'path';
import { checkDataCompleteness } from './checkDataCompleteness';
import { parseFileToJson } from './parseFileToJson';
import { Cell, DataType, ParsedFile } from './types';
import { ValidationError } from './errors';
import { ValidationErrorCode } from './constants/errorCodes';

const fixture = (name: string) => path.join(__dirname, '__fixtures__', name);

const wrapColumn = (data_type: DataType, values: Cell['value'][]): ParsedFile => ({
  headers: [{ header_id: 'col', header_label: 'Col', isDuplicateName: false }],
  rows: values.map((value) => ({ col: { value, data_type } })),
  colAttributes: [],
});

const colAttrsFor = (data_type: DataType, values: Cell['value'][]) =>
  checkDataCompleteness(wrapColumn(data_type, values))[0];

describe('checkDataCompleteness - standard deviation', () => {
  it('computes population standard deviation for a Number column', () => {
    const attrs = colAttrsFor('Number', [2, 4, 4, 4, 5, 5, 7, 9]);
    expect(attrs.standard_deviation).toBeCloseTo(2, 5);
  });

  it('does not compute standard_deviation for a String column', () => {
    const attrs = colAttrsFor('String', ['a', 'b', 'c']);
    expect(attrs.standard_deviation).toBeUndefined();
  });

  it('does not compute standard_deviation for a Date column', () => {
    const attrs = colAttrsFor('Date', [new Date('2022-01-01'), new Date('2022-06-01')]);
    expect(attrs.standard_deviation).toBeUndefined();
  });
});

describe('checkDataCompleteness - isBiased', () => {
  it('flags a Number column biased toward negative values', () => {
    const attrs = colAttrsFor('Number', [-1, -2, -3, -4, 5]);
    expect(attrs.isBiased).toBe(true);
    expect(attrs.biasedValue).toBe('negative');
  });

  it('does not flag a Number column with a balanced sign split', () => {
    const attrs = colAttrsFor('Number', [-1, -1, 2, 2, 3]);
    expect(attrs.isBiased).toBe(false);
    expect(attrs.biasedValue).toBeUndefined();
  });

  it('flags a Date column biased toward one year', () => {
    const attrs = colAttrsFor('Date', [
      new Date('2022-01-01'),
      new Date('2022-02-01'),
      new Date('2022-03-01'),
      new Date('2022-04-01'),
      new Date('2021-01-01'),
    ]);
    expect(attrs.isBiased).toBe(true);
    expect(attrs.biasedValue).toBe('2022');
  });

  it('flags a String column biased toward one repeated value', () => {
    const attrs = colAttrsFor('String', ['Apple', 'Apple', 'Apple', 'Apple', 'Banana']);
    expect(attrs.isBiased).toBe(true);
    expect(attrs.biasedValue).toBe('Apple');
  });

  it('excludes missing/null cells from the bias calculation', () => {
    const attrs = colAttrsFor('Number', [null, '-', 5, -5, -5, -5]);
    expect(attrs.isBiased).toBe(true);
    expect(attrs.biasedValue).toBe('negative');
  });
});

describe('checkDataCompleteness - date range completeness', () => {
  it('flags isDateRangeComplete true when every year in range is present', () => {
    const attrs = colAttrsFor('Date', [
      new Date('2022-01-01'),
      new Date('2022-02-01'),
      new Date('2022-03-01'),
      new Date('2022-04-01'),
      new Date('2021-01-01'),
    ]);
    expect(attrs.isDateRangeComplete).toBe(true);
    expect(attrs.missingYears).toEqual([]);
  });

  it('flags isDateRangeComplete false and lists missing years when a year is skipped', () => {
    const attrs = colAttrsFor('Date', [
      new Date('2020-01-01'),
      new Date('2020-06-01'),
      new Date('2022-01-01'),
    ]);
    expect(attrs.isDateRangeComplete).toBe(false);
    expect(attrs.missingYears).toEqual([2021]);
  });

  it('computes date-range attributes for a DateTime column', () => {
    const attrs = colAttrsFor('DateTime', [
      new Date('2020-01-01T09:00:00'),
      new Date('2020-06-01T09:00:00'),
      new Date('2022-01-01T09:00:00'),
    ]);
    expect(attrs.isDateRangeComplete).toBe(false);
    expect(attrs.missingYears).toEqual([2021]);
  });

  it('does not compute date-range attributes for a Time column', () => {
    const attrs = colAttrsFor('Time', [new Date(1970, 0, 1, 9, 0), new Date(1970, 0, 1, 14, 30)]);
    expect(attrs.isDateRangeComplete).toBeUndefined();
    expect(attrs.missingYears).toBeUndefined();
  });
});

describe('checkDataCompleteness - numeric range', () => {
  it('computes min/max/average for a Number column', () => {
    const attrs = colAttrsFor('Number', [2, 4, 6, 8]);
    expect(attrs.min_value).toBe(2);
    expect(attrs.max_value).toBe(8);
    expect(attrs.average_value).toBeCloseTo(5, 5);
  });

  it('does not compute numeric range for a String column', () => {
    const attrs = colAttrsFor('String', ['a', 'b']);
    expect(attrs.min_value).toBeUndefined();
    expect(attrs.max_value).toBeUndefined();
    expect(attrs.average_value).toBeUndefined();
  });

  it('excludes missing/null cells from min/max/average', () => {
    const attrs = colAttrsFor('Number', [null, '-', 10, 20]);
    expect(attrs.min_value).toBe(10);
    expect(attrs.max_value).toBe(20);
    expect(attrs.average_value).toBe(15);
  });
});

describe('checkDataCompleteness - top values', () => {
  it('returns the top 3 most frequent values for a repeating String column, sorted desc', () => {
    const attrs = colAttrsFor('String', ['a', 'a', 'a', 'b', 'b', 'c', 'd']);
    expect(attrs.topValues).toEqual([
      { value: 'a', count: 3 },
      { value: 'b', count: 2 },
      { value: 'c', count: 1 },
    ]);
  });

  it('breaks ties in frequency by first-seen order', () => {
    const attrs = colAttrsFor('String', ['b', 'a', 'b', 'a']);
    expect(attrs.topValues).toEqual([
      { value: 'b', count: 2 },
      { value: 'a', count: 2 },
    ]);
  });

  it('returns all distinct values (not just top 3) when every value is unique', () => {
    const attrs = colAttrsFor('String', ['a', 'b', 'c', 'd', 'e']);
    expect(attrs.topValues).toEqual([
      { value: 'a', count: 1 },
      { value: 'b', count: 1 },
      { value: 'c', count: 1 },
      { value: 'd', count: 1 },
      { value: 'e', count: 1 },
    ]);
  });

  it('returns a single entry for a single-value column', () => {
    const attrs = colAttrsFor('String', ['only']);
    expect(attrs.topValues).toEqual([{ value: 'only', count: 1 }]);
  });

  it('does not compute topValues for an all-missing column (early return)', () => {
    const attrs = colAttrsFor('String', [null, '-', '']);
    expect(attrs.topValues).toBeUndefined();
  });

  it('computes top values for a Date column', () => {
    const d1 = new Date('2022-01-01');
    const d2 = new Date('2022-06-01');
    const attrs = colAttrsFor('Date', [d1, d1, d2]);
    expect(attrs.topValues).toEqual([
      { value: d1, count: 2 },
      { value: d2, count: 1 },
    ]);
  });

  it('computes top values for a Time column', () => {
    const t1 = new Date(1970, 0, 1, 9, 0);
    const t2 = new Date(1970, 0, 1, 14, 30);
    const attrs = colAttrsFor('Time', [t1, t1, t2]);
    expect(attrs.topValues).toEqual([
      { value: t1, count: 2 },
      { value: t2, count: 1 },
    ]);
  });

  it('computes top values for a DateTime column', () => {
    const dt1 = new Date('2022-01-01T09:00:00');
    const dt2 = new Date('2022-06-01T14:30:00');
    const attrs = colAttrsFor('DateTime', [dt1, dt2, dt2]);
    expect(attrs.topValues).toEqual([
      { value: dt2, count: 2 },
      { value: dt1, count: 1 },
    ]);
  });

  it('does not compute topValues for a Number column', () => {
    const attrs = colAttrsFor('Number', [1, 2, 3]);
    expect(attrs.topValues).toBeUndefined();
  });
});

describe('checkDataCompleteness - input validation', () => {
  it('throws ValidationError(INVALID_PARSED_FILE) for null input', () => {
    expect(() => checkDataCompleteness(null as unknown as ParsedFile)).toThrow(ValidationError);
    try {
      checkDataCompleteness(null as unknown as ParsedFile);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_PARSED_FILE);
    }
  });

  it('throws ValidationError(INVALID_HEADERS) when headers is not an array', () => {
    const parsed = { headers: undefined, rows: [], colAttributes: [] } as unknown as ParsedFile;
    expect(() => checkDataCompleteness(parsed)).toThrow(ValidationError);
    try {
      checkDataCompleteness(parsed);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_HEADERS);
    }
  });

  it('throws ValidationError(INVALID_ROWS) when rows is not an array', () => {
    const parsed = { headers: [], rows: undefined, colAttributes: [] } as unknown as ParsedFile;
    expect(() => checkDataCompleteness(parsed)).toThrow(ValidationError);
    try {
      checkDataCompleteness(parsed);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_ROWS);
    }
  });
});

describe('checkDataCompleteness - integration with parseFileToJson', () => {
  it('computes one colAttributes entry per header', () => {
    const parsed = parseFileToJson(fixture('sensitive-data.csv'));
    const colAttributes = checkDataCompleteness(parsed);
    expect(colAttributes.map((attrs) => attrs.header_id)).toEqual([
      'full_name',
      'email',
      'phone',
      'notes',
    ]);
  });
});
