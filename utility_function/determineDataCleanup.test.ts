import * as path from 'path';
import { determineDataCleanup } from './determineDataCleanup';
import { parseFileToJson } from './parseFileToJson';
import { Cell, ParsedFile } from './types';
import { ValidationError } from './errors';
import { ValidationErrorCode } from './constants/errorCodes';

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

  describe('input validation', () => {
    it('throws ValidationError(INVALID_PARSED_FILE) for null input', () => {
      try {
        determineDataCleanup(null as unknown as ParsedFile);
        throw new Error('expected determineDataCleanup to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_PARSED_FILE);
      }
    });

    it('throws ValidationError(INVALID_HEADERS) when headers is not an array', () => {
      const parsed = { headers: undefined, rows: [], colAttributes: [] } as unknown as ParsedFile;
      try {
        determineDataCleanup(parsed);
        throw new Error('expected determineDataCleanup to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_HEADERS);
      }
    });

    it('throws ValidationError(INVALID_ROWS) when rows is not an array', () => {
      const parsed = { headers: [], rows: undefined, colAttributes: [] } as unknown as ParsedFile;
      try {
        determineDataCleanup(parsed);
        throw new Error('expected determineDataCleanup to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_ROWS);
      }
    });

    it('throws ValidationError(MISSING_ROW_CELL) when a row is missing a cell for a declared header', () => {
      const parsed: ParsedFile = {
        headers: [
          { header_id: 'col1', header_label: 'Col1', isDuplicateName: false },
          { header_id: 'col2', header_label: 'Col2', isDuplicateName: false },
        ],
        rows: [{ col1: { value: 'a', data_type: 'String' } }],
        colAttributes: [],
      };
      try {
        determineDataCleanup(parsed);
        throw new Error('expected determineDataCleanup to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe(ValidationErrorCode.MISSING_ROW_CELL);
      }
    });
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
