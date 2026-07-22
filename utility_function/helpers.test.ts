import { Cell, ParsedFile, Row } from './types';
import {
  biasBucketKey,
  computeBiasAttributes,
  computeDateRangeAttributes,
  computeStandardDeviationForCells,
  getNonMissingCells,
  isMissingData,
  mostCommonDataType,
  standardDeviation,
  validateParsedFile,
} from './helpers';
import { ValidationError } from './errors';
import { ValidationErrorCode } from './constants/errorCodes';

const numberCell = (value: Cell['value']): Cell => ({ value, data_type: 'Number' });
const dateCell = (value: Cell['value']): Cell => ({ value, data_type: 'Date' });
const stringCell = (value: Cell['value']): Cell => ({ value, data_type: 'String' });

describe('isMissingData', () => {
  it.each([null, '', '-', 'null', '  '])('flags %p as missing', (value) => {
    expect(isMissingData(value)).toBe(true);
  });

  it.each(['Alice', 0, new Date('2023-01-01')])('does not flag %p as missing', (value) => {
    expect(isMissingData(value as Cell['value'])).toBe(false);
  });
});

describe('mostCommonDataType', () => {
  it('returns the data type shared by the most cells', () => {
    expect(mostCommonDataType([numberCell(1), numberCell(2), stringCell('x')])).toBe('Number');
  });

  it('returns String when the cell list is empty', () => {
    expect(mostCommonDataType([])).toBe('String');
  });
});

describe('standardDeviation', () => {
  it('computes the population standard deviation', () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 5);
  });

  it('returns 0 for a single value', () => {
    expect(standardDeviation([5])).toBe(0);
  });
});

describe('biasBucketKey', () => {
  it.each([
    [5, 'positive'],
    [-5, 'negative'],
    [0, 'zero'],
  ])('buckets Number %p as %p', (value, expected) => {
    expect(biasBucketKey('Number', value)).toBe(expected);
  });

  it('buckets a Date value by year', () => {
    expect(biasBucketKey('Date', new Date('2022-06-01'))).toBe('2022');
  });

  it('buckets a String value as itself', () => {
    expect(biasBucketKey('String', 'Apple')).toBe('Apple');
  });

  it('returns null when the value does not match the data type', () => {
    expect(biasBucketKey('Number', 'not-a-number')).toBeNull();
  });
});

describe('getNonMissingCells', () => {
  const header = { header_id: 'col', header_label: 'Col', isDuplicateName: false };

  it('splits rows into all cells and non-missing cells', () => {
    const rows = [{ col: numberCell(5) }, { col: numberCell(null) }, { col: numberCell(-5) }];
    const { cells, nonMissing } = getNonMissingCells(header, rows);
    expect(cells).toHaveLength(3);
    expect(nonMissing.map((cell) => cell.value)).toEqual([5, -5]);
  });

  it('skips rows missing the column entirely', () => {
    const rows: Row[] = [{ col: numberCell(5) }, { col: undefined as unknown as Cell }];
    const { cells } = getNonMissingCells(header, rows);
    expect(cells).toHaveLength(1);
  });
});

describe('computeStandardDeviationForCells', () => {
  it('computes standard deviation from numeric cells', () => {
    expect(computeStandardDeviationForCells([numberCell(2), numberCell(4)])).toBe(1);
  });

  it('returns undefined when there are no numeric cells', () => {
    expect(computeStandardDeviationForCells([stringCell('a')])).toBeUndefined();
  });
});

describe('computeBiasAttributes', () => {
  it('flags a Number column biased toward negative values', () => {
    expect(
      computeBiasAttributes('Number', [
        numberCell(-1),
        numberCell(-2),
        numberCell(-3),
        numberCell(-4),
        numberCell(5),
      ]),
    ).toEqual({ isBiased: true, biasedValue: 'negative' });
  });

  it('does not flag a Number column with a balanced sign split', () => {
    expect(
      computeBiasAttributes('Number', [numberCell(-1), numberCell(-1), numberCell(2), numberCell(2), numberCell(3)]),
    ).toEqual({ isBiased: false });
  });

  it('returns isBiased false when there are no bucketable cells', () => {
    expect(computeBiasAttributes('Number', [])).toEqual({ isBiased: false });
  });
});

describe('validateParsedFile', () => {
  const valid: ParsedFile = { headers: [], rows: [], colAttributes: [] };

  it('does not throw for a valid ParsedFile', () => {
    expect(() => validateParsedFile(valid)).not.toThrow();
  });

  it.each([null, undefined, 'not-an-object', 42])(
    'throws ValidationError(INVALID_PARSED_FILE) for %p',
    (value) => {
      try {
        validateParsedFile(value as unknown as ParsedFile);
        throw new Error('expected validateParsedFile to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_PARSED_FILE);
      }
    },
  );

  it('throws ValidationError(INVALID_HEADERS) when headers is not an array', () => {
    try {
      validateParsedFile({ ...valid, headers: undefined } as unknown as ParsedFile);
      throw new Error('expected validateParsedFile to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_HEADERS);
    }
  });

  it('throws ValidationError(INVALID_ROWS) when rows is not an array', () => {
    try {
      validateParsedFile({ ...valid, rows: undefined } as unknown as ParsedFile);
      throw new Error('expected validateParsedFile to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_ROWS);
    }
  });
});

describe('computeDateRangeAttributes', () => {
  it('reports a complete range when every year is present', () => {
    expect(
      computeDateRangeAttributes([
        dateCell(new Date('2021-01-01')),
        dateCell(new Date('2022-01-01')),
      ]),
    ).toEqual({ isDateRangeComplete: true, missingYears: [] });
  });

  it('lists missing years when a year is skipped', () => {
    expect(
      computeDateRangeAttributes([
        dateCell(new Date('2020-01-01')),
        dateCell(new Date('2020-06-01')),
        dateCell(new Date('2022-01-01')),
      ]),
    ).toEqual({ isDateRangeComplete: false, missingYears: [2021] });
  });

  it('returns an empty object when there are no date cells', () => {
    expect(computeDateRangeAttributes([numberCell(1)])).toEqual({});
  });
});
