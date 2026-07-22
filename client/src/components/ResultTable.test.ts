import { describe, expect, it } from 'vitest';
import {
  formatCellValue,
  formatValue,
  getDisplayedTopValues,
  getMostRepeatingEntry,
} from './ResultTable';
import type { Cell } from '../types';

const cell = (value: Cell['value'], data_type: Cell['data_type']): Cell => ({ value, data_type });

describe('formatValue', () => {
  it('returns an empty string for an undefined cell', () => {
    expect(formatValue(undefined)).toBe('');
  });

  it('returns an empty string for a null value', () => {
    expect(formatValue(cell(null, 'String'))).toBe('');
  });

  it('returns a String value as-is', () => {
    expect(formatValue(cell('Alice', 'String'))).toBe('Alice');
  });

  it('stringifies a Number value', () => {
    expect(formatValue(cell(42, 'Number'))).toBe('42');
  });

  it('formats a Date cell using toLocaleDateString', () => {
    const value = new Date('2023-01-15');
    expect(formatValue(cell(value, 'Date'))).toBe(value.toLocaleDateString());
  });

  it('formats a Time cell using toLocaleTimeString', () => {
    const value = new Date(1970, 0, 1, 14, 30);
    expect(formatValue(cell(value, 'Time'))).toBe(value.toLocaleTimeString());
  });

  it('formats a DateTime cell using toLocaleString', () => {
    const value = new Date('2023-01-15T14:30:00');
    expect(formatValue(cell(value, 'DateTime'))).toBe(value.toLocaleString());
  });
});

describe('formatCellValue', () => {
  it('returns an empty string for undefined', () => {
    expect(formatCellValue(undefined, 'String')).toBe('');
  });

  it('returns an empty string for null', () => {
    expect(formatCellValue(null, 'String')).toBe('');
  });

  it('returns a String value as-is', () => {
    expect(formatCellValue('Alice', 'String')).toBe('Alice');
  });

  it('stringifies a Number value', () => {
    expect(formatCellValue(42, 'Number')).toBe('42');
  });

  it('formats a Date value using toLocaleDateString', () => {
    const value = new Date('2023-01-15');
    expect(formatCellValue(value, 'Date')).toBe(value.toLocaleDateString());
  });

  it('formats a Time value using toLocaleTimeString', () => {
    const value = new Date(1970, 0, 1, 14, 30);
    expect(formatCellValue(value, 'Time')).toBe(value.toLocaleTimeString());
  });

  it('formats a DateTime value using toLocaleString', () => {
    const value = new Date('2023-01-15T14:30:00');
    expect(formatCellValue(value, 'DateTime')).toBe(value.toLocaleString());
  });
});

describe('getMostRepeatingEntry', () => {
  it('returns null for a Number column regardless of topValues', () => {
    expect(
      getMostRepeatingEntry({
        data_type: 'Number',
        topValues: [
          { value: 1, count: 5 },
          { value: 2, count: 1 },
        ],
      }),
    ).toBeNull();
  });

  it('returns null when topValues is undefined', () => {
    expect(getMostRepeatingEntry({ data_type: 'String', topValues: undefined })).toBeNull();
  });

  it('returns null when there is only one distinct value', () => {
    expect(
      getMostRepeatingEntry({ data_type: 'String', topValues: [{ value: 'Male', count: 10 }] }),
    ).toBeNull();
  });

  it('returns null when every distinct value is unique (top count is 1)', () => {
    expect(
      getMostRepeatingEntry({
        data_type: 'String',
        topValues: [
          { value: 'a', count: 1 },
          { value: 'b', count: 1 },
        ],
      }),
    ).toBeNull();
  });

  it('returns the top entry when it repeats and there are 2+ distinct values', () => {
    const topValues = [
      { value: 'Apple', count: 3 },
      { value: 'Banana', count: 1 },
    ];
    expect(getMostRepeatingEntry({ data_type: 'String', topValues })).toEqual({
      value: 'Apple',
      count: 3,
    });
  });
});

describe('getDisplayedTopValues', () => {
  it('returns an empty array when topValues is undefined', () => {
    expect(getDisplayedTopValues({ topValues: undefined })).toEqual([]);
  });

  it('returns all entries when there are 3 or fewer', () => {
    const topValues = [
      { value: 'a', count: 2 },
      { value: 'b', count: 1 },
    ];
    expect(getDisplayedTopValues({ topValues })).toEqual(topValues);
  });

  it('truncates to the first 3 entries when there are more than 3', () => {
    const topValues = [
      { value: 'a', count: 5 },
      { value: 'b', count: 4 },
      { value: 'c', count: 3 },
      { value: 'd', count: 2 },
    ];
    expect(getDisplayedTopValues({ topValues })).toEqual(topValues.slice(0, 3));
  });
});
