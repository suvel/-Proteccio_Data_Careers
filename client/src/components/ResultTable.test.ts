import { describe, expect, it } from 'vitest';
import { formatValue } from './ResultTable';
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
