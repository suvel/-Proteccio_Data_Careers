import { ColumnConsistencyScore, Header, ParsedFile, Row } from './types';
import { getNonMissingCells, mostCommonDataType, validateParsedFile } from './helpers';

/**
 * Computes a column's consistency score: the percentage of its non-missing cells
 * whose data type matches the column's majority data type. A column with no
 * non-missing cells scores 0.
 * @example
 * computeColumnConsistencyScore(
 *   { header_id: 'age', header_label: 'Age', isDuplicateName: false },
 *   [{ age: { value: 2, data_type: 'Number' } }, { age: { value: 'two', data_type: 'String' } }],
 * )
 * // => { header_id: 'age', consistencyScore: 50 }
 */
export function computeColumnConsistencyScore(
  header: Header,
  rows: Row[],
): ColumnConsistencyScore {
  const { cells, nonMissing } = getNonMissingCells(header, rows);
  if (nonMissing.length === 0) return { header_id: header.header_id, consistencyScore: 0 };

  const dataType = mostCommonDataType(nonMissing.length > 0 ? nonMissing : cells);
  const matching = nonMissing.filter((cell) => cell.data_type === dataType);

  console.log({ header_id: header.header_id, dataType, matching: matching.length, total: nonMissing.length });

  const consistencyScore = (100 * matching.length) / nonMissing.length;
  return { header_id: header.header_id, consistencyScore };
}

/**
 * Computes a type-consistency score for every column plus the overall mean across
 * columns. A file with no headers scores 0 overall.
 * @example
 * computeConsistencyScore({
 *   headers: [{ header_id: 'age', header_label: 'Age', isDuplicateName: false }],
 *   rows: [{ age: { value: 2, data_type: 'Number' } }, { age: { value: 'two', data_type: 'String' } }],
 *   colAttributes: [],
 * })
 * // => { overallConsistencyScore: 50, columnScores: [{ header_id: 'age', consistencyScore: 50 }] }
 */
export function computeConsistencyScore(parsedFile: ParsedFile): {
  overallConsistencyScore: number;
  columnScores: ColumnConsistencyScore[];
} {
  validateParsedFile(parsedFile);
  const columnScores = parsedFile.headers.map((header) =>
    computeColumnConsistencyScore(header, parsedFile.rows),
  );
  const overallConsistencyScore =
    columnScores.length === 0
      ? 0
      : columnScores.reduce((sum, score) => sum + score.consistencyScore, 0) /
      columnScores.length;
  return { overallConsistencyScore, columnScores };
}
