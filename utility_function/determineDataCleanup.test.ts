import * as path from 'path';
import { determineDataCleanup } from './determineDataCleanup';
import { parseFileToJson } from './parseFileToJson';
import { Cell, ParsedFile } from './types';

const fixture = (name: string) => path.join(__dirname, '__fixtures__', name);

const wrap = (columnValues: Cell['value'][][]): ParsedFile => {
  const headers = columnValues.map((_, index) => ({
    header_id: `col${index + 1}`,
    header_label: `Col${index + 1}`,
    isDuplicateName: false,
  }));
  const rowCount = columnValues[0]?.length ?? 0;
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: ParsedFile['rows'][number] = {};
    headers.forEach((header, colIndex) => {
      row[header.header_id] = { value: columnValues[colIndex][rowIndex], data_type: 'String' };
    });
    return row;
  });
  return { headers, rows, colAttributes: [] };
};

describe('determineDataCleanup', () => {
  it('reports no duplicateRows when every row is unique', () => {
    const parsed = wrap([
      ['a', 'b', 'c'],
      [1, 2, 3],
    ]);
    expect(determineDataCleanup(parsed).duplicateRows).toEqual({});
  });

  it('groups rows that are identical across all columns', () => {
    const parsed = wrap([
      ['a', 'b', 'a'],
      [1, 2, 1],
    ]);
    const { duplicateRows } = determineDataCleanup(parsed);
    expect(duplicateRows).toEqual({ C1_1C2_1: [0, 2] });
  });

  it('does not group rows that match in one column but differ in another', () => {
    const parsed = wrap([
      ['a', 'a'],
      [1, 2],
    ]);
    expect(determineDataCleanup(parsed).duplicateRows).toEqual({});
  });

  it('treats missing/null values in a column as equal to each other', () => {
    const parsed = wrap([
      [null, null, 'x'],
      [1, 1, 2],
    ]);
    const { duplicateRows } = determineDataCleanup(parsed);
    expect(duplicateRows).toEqual({ C1_1C2_1: [0, 1] });
  });

  it('treats different missing-data representations in a column as equal', () => {
    const parsed = wrap([
      ['', '-', 'x'],
      [1, 1, 2],
    ]);
    const { duplicateRows } = determineDataCleanup(parsed);
    expect(duplicateRows).toEqual({ C1_1C2_1: [0, 1] });
  });

  it('does not mutate the input ParsedFile', () => {
    const parsed = wrap([['a', 'a']]);
    const originalRows = parsed.rows;
    const result = determineDataCleanup(parsed);

    expect(parsed.duplicateRows).toBeUndefined();
    expect(parsed.rows).toBe(originalRows);
    expect(result).not.toBe(parsed);
  });

  describe('integration with parseFileToJson', () => {
    it('finds the duplicate row group across columns', () => {
      const parsed = parseFileToJson(fixture('duplicate-rows.csv'));
      const { duplicateRows } = determineDataCleanup(parsed);
      expect(duplicateRows).toEqual({ C1_1C2_1: [0, 2] });
    });

    it('reports no duplicates for a file with all-unique rows', () => {
      const parsed = parseFileToJson(fixture('sensitive-data.csv'));
      const { duplicateRows } = determineDataCleanup(parsed);
      expect(duplicateRows).toEqual({});
    });
  });
});
