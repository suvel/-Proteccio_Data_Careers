import { computeQualityScore } from './computeQualityScore';
import { Cell, DataType, ParsedFile } from './types';
import { ValidationError } from './errors';
import { ValidationErrorCode } from './constants/errorCodes';

const wrapColumns = (columns: Record<string, { data_type: DataType; values: Cell['value'][] }>): ParsedFile => {
  const headerIds = Object.keys(columns);
  const rowCount = Math.max(...headerIds.map((id) => columns[id].values.length));
  return {
    headers: headerIds.map((id) => ({ header_id: id, header_label: id, isDuplicateName: false })),
    rows: Array.from({ length: rowCount }, (_, i) =>
      Object.fromEntries(
        headerIds.map((id) => [
          id,
          { value: columns[id].values[i], data_type: columns[id].data_type } as Cell,
        ]),
      ),
    ),
    colAttributes: [],
    download_count: 0,
  };
};

const wrapColumn = (data_type: DataType, values: Cell['value'][]): ParsedFile =>
  wrapColumns({ col: { data_type, values } });

describe('computeQualityScore - per column', () => {
  it('scores a fully-complete column at 100', () => {
    const { columnScores } = computeQualityScore(wrapColumn('Number', [1, 2, 3]));
    expect(columnScores).toEqual([{ header_id: 'col', qualityScore: 100 }]);
  });

  it('scores an all-missing column at 0', () => {
    const { columnScores } = computeQualityScore(wrapColumn('String', [null, '-', '']));
    expect(columnScores).toEqual([{ header_id: 'col', qualityScore: 0 }]);
  });

  it('scores a mixed column at the correct percentage', () => {
    const { columnScores } = computeQualityScore(wrapColumn('Number', [1, null, 3, '-']));
    expect(columnScores[0].qualityScore).toBeCloseTo(50, 5);
  });
});

describe('computeQualityScore - overall', () => {
  it('averages scores across multiple columns', () => {
    const parsed = wrapColumns({
      complete: { data_type: 'Number', values: [1, 2] },
      empty: { data_type: 'Number', values: [null, null] },
    });
    const { overallQualityScore, columnScores } = computeQualityScore(parsed);
    expect(columnScores).toEqual([
      { header_id: 'complete', qualityScore: 100 },
      { header_id: 'empty', qualityScore: 0 },
    ]);
    expect(overallQualityScore).toBeCloseTo(50, 5);
  });

  it('returns 0 overall for a file with no headers', () => {
    const { overallQualityScore, columnScores } = computeQualityScore({
      headers: [],
      rows: [],
      colAttributes: [],
      download_count: 0,
    });
    expect(overallQualityScore).toBe(0);
    expect(columnScores).toEqual([]);
  });
});

describe('computeQualityScore - input validation', () => {
  it('throws ValidationError(INVALID_PARSED_FILE) for null input', () => {
    expect(() => computeQualityScore(null as unknown as ParsedFile)).toThrow(ValidationError);
    try {
      computeQualityScore(null as unknown as ParsedFile);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_PARSED_FILE);
    }
  });

  it('throws ValidationError(INVALID_HEADERS) when headers is not an array', () => {
    const parsed = { headers: undefined, rows: [], colAttributes: [] } as unknown as ParsedFile;
    expect(() => computeQualityScore(parsed)).toThrow(ValidationError);
    try {
      computeQualityScore(parsed);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_HEADERS);
    }
  });

  it('throws ValidationError(INVALID_ROWS) when rows is not an array', () => {
    const parsed = { headers: [], rows: undefined, colAttributes: [] } as unknown as ParsedFile;
    expect(() => computeQualityScore(parsed)).toThrow(ValidationError);
    try {
      computeQualityScore(parsed);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_ROWS);
    }
  });
});
