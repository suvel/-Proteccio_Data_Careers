import { computeConsistencyScore } from './computeConsistencyScore';
import { Cell, DataType, ParsedFile } from './types';
import { ValidationError } from './errors';
import { ValidationErrorCode } from './constants/errorCodes';

const wrapColumns = (
  columns: Record<string, { data_type: DataType; values: Cell['value'][]; cellTypes?: DataType[] }>,
): ParsedFile => {
  const headerIds = Object.keys(columns);
  const rowCount = Math.max(...headerIds.map((id) => columns[id].values.length));
  return {
    headers: headerIds.map((id) => ({ header_id: id, header_label: id, isDuplicateName: false })),
    rows: Array.from({ length: rowCount }, (_, i) =>
      Object.fromEntries(
        headerIds.map((id) => [
          id,
          {
            value: columns[id].values[i],
            data_type: columns[id].cellTypes ? columns[id].cellTypes![i] : columns[id].data_type,
          } as Cell,
        ]),
      ),
    ),
    colAttributes: [],
    download_count: 0,
  };
};

const wrapColumn = (
  data_type: DataType,
  values: Cell['value'][],
  cellTypes?: DataType[],
): ParsedFile => wrapColumns({ col: { data_type, values, cellTypes } });

describe('computeConsistencyScore - per column', () => {
  it('scores a fully-consistent column at 100', () => {
    const { columnScores } = computeConsistencyScore(wrapColumn('Number', [1, 2, 3]));
    expect(columnScores).toEqual([{ header_id: 'col', consistencyScore: 100 }]);
  });

  it('scores an all-missing column at 0', () => {
    const { columnScores } = computeConsistencyScore(wrapColumn('String', [null, '-', '']));
    expect(columnScores).toEqual([{ header_id: 'col', consistencyScore: 0 }]);
  });

  it('scores a column with mismatched types at the correct percentage', () => {
    const { columnScores } = computeConsistencyScore(
      wrapColumn('Number', [1, 'two', 3, 4], ['Number', 'String', 'Number', 'Number']),
    );
    expect(columnScores[0].consistencyScore).toBeCloseTo(75, 5);
  });
});

describe('computeConsistencyScore - overall', () => {
  it('averages scores across multiple columns', () => {
    const parsed = wrapColumns({
      consistent: { data_type: 'Number', values: [1, 2] },
      empty: { data_type: 'Number', values: [null, null] },
    });
    const { overallConsistencyScore, columnScores } = computeConsistencyScore(parsed);
    expect(columnScores).toEqual([
      { header_id: 'consistent', consistencyScore: 100 },
      { header_id: 'empty', consistencyScore: 0 },
    ]);
    expect(overallConsistencyScore).toBeCloseTo(50, 5);
  });

  it('returns 0 overall for a file with no headers', () => {
    const { overallConsistencyScore, columnScores } = computeConsistencyScore({
      headers: [],
      rows: [],
      colAttributes: [],
      download_count: 0,
    });
    expect(overallConsistencyScore).toBe(0);
    expect(columnScores).toEqual([]);
  });
});

describe('computeConsistencyScore - input validation', () => {
  it('throws ValidationError(INVALID_PARSED_FILE) for null input', () => {
    expect(() => computeConsistencyScore(null as unknown as ParsedFile)).toThrow(ValidationError);
    try {
      computeConsistencyScore(null as unknown as ParsedFile);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_PARSED_FILE);
    }
  });

  it('throws ValidationError(INVALID_HEADERS) when headers is not an array', () => {
    const parsed = { headers: undefined, rows: [], colAttributes: [] } as unknown as ParsedFile;
    expect(() => computeConsistencyScore(parsed)).toThrow(ValidationError);
    try {
      computeConsistencyScore(parsed);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_HEADERS);
    }
  });

  it('throws ValidationError(INVALID_ROWS) when rows is not an array', () => {
    const parsed = { headers: [], rows: undefined, colAttributes: [] } as unknown as ParsedFile;
    expect(() => computeConsistencyScore(parsed)).toThrow(ValidationError);
    try {
      computeConsistencyScore(parsed);
    } catch (error) {
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_ROWS);
    }
  });
});
