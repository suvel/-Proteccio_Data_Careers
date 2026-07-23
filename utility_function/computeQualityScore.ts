import { ColumnQualityScore, Header, ParsedFile, Row } from './types';
import { getNonMissingCells, validateParsedFile } from './helpers';

/**
 * Computes a column's completeness score: the percentage of its cells that are
 * not missing data. An empty column scores 0.
 * @example
 * computeColumnQualityScore(
 *   { header_id: 'age', header_label: 'Age', isDuplicateName: false },
 *   [{ age: { value: 2, data_type: 'Number' } }, { age: { value: null, data_type: 'Number' } }],
 * )
 * // => { header_id: 'age', qualityScore: 50 }
 */
export function computeColumnQualityScore(header: Header, rows: Row[]): ColumnQualityScore {
  const { cells, nonMissing } = getNonMissingCells(header, rows);
  const qualityScore = cells.length === 0 ? 0 : (100 * nonMissing.length) / cells.length;
  return { header_id: header.header_id, qualityScore };
}

/**
 * Computes a completeness-based quality score for every column plus the overall
 * mean across columns. A file with no headers scores 0 overall.
 * @example
 * computeQualityScore({
 *   headers: [{ header_id: 'age', header_label: 'Age', isDuplicateName: false }],
 *   rows: [{ age: { value: 2, data_type: 'Number' } }, { age: { value: null, data_type: 'Number' } }],
 *   colAttributes: [],
 * })
 * // => { overallQualityScore: 50, columnScores: [{ header_id: 'age', qualityScore: 50 }] }
 */
export function computeQualityScore(parsedFile: ParsedFile): {
  overallQualityScore: number;
  columnScores: ColumnQualityScore[];
} {
  validateParsedFile(parsedFile);
  const columnScores = parsedFile.headers.map((header) =>
    computeColumnQualityScore(header, parsedFile.rows),
  );
  const overallQualityScore =
    columnScores.length === 0
      ? 0
      : columnScores.reduce((sum, score) => sum + score.qualityScore, 0) / columnScores.length;
  return { overallQualityScore, columnScores };
}
