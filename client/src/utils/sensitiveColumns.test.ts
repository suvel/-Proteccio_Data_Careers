import { describe, expect, it } from 'vitest';
import { getSensitiveColumnIds, getSensitiveColumnInfo } from './sensitiveColumns';
import type { Cell, Header, ParsedFile } from '../types';

const cell = (value: Cell['value'], sensitive_data?: boolean, sensitive_pattern?: string): Cell => ({
  value,
  data_type: 'String',
  sensitive_data,
  sensitive_pattern,
});

const header = (header_id: string): Header => ({ header_id, header_label: header_id, isDuplicateName: false });

const parsedFile = (headers: Header[], rows: ParsedFile['rows']): ParsedFile => ({
  headers,
  rows,
  colAttributes: [],
});

describe('getSensitiveColumnIds', () => {
  it('returns an empty array when no cells are flagged sensitive', () => {
    const result = parsedFile(
      [header('name'), header('email')],
      [{ name: cell('Alice'), email: cell('alice@example.com') }],
    );
    expect(getSensitiveColumnIds(result)).toEqual([]);
  });

  it('returns the header id of a column with at least one sensitive cell', () => {
    const result = parsedFile(
      [header('name'), header('email')],
      [
        { name: cell('Alice'), email: cell('alice@example.com', true) },
        { name: cell('Bob'), email: cell('bob@example.com') },
      ],
    );
    expect(getSensitiveColumnIds(result)).toEqual(['email']);
  });

  it('preserves header order and dedupes repeated flags across rows', () => {
    const result = parsedFile(
      [header('ssn'), header('name'), header('email')],
      [
        { ssn: cell('111-22-3333', true), name: cell('Alice'), email: cell('alice@example.com', true) },
        { ssn: cell('444-55-6666', true), name: cell('Bob'), email: cell('bob@example.com', true) },
      ],
    );
    expect(getSensitiveColumnIds(result)).toEqual(['ssn', 'email']);
  });
});

describe('getSensitiveColumnInfo', () => {
  it('reports the distinct matched pattern names per column', () => {
    const result = parsedFile(
      [header('contact')],
      [
        { contact: cell('alice@example.com', true, 'Email') },
        { contact: cell('9876543210', true, 'Phone Number') },
        { contact: cell('alice2@example.com', true, 'Email') },
      ],
    );
    expect(getSensitiveColumnInfo(result)).toEqual([
      { headerId: 'contact', matchedPatterns: ['Email', 'Phone Number'] },
    ]);
  });

  it('omits columns with no sensitive cells', () => {
    const result = parsedFile([header('name')], [{ name: cell('Alice') }]);
    expect(getSensitiveColumnInfo(result)).toEqual([]);
  });
});
