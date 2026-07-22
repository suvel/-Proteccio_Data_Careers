import { ParsedFile } from './types';
import { buildColumnValueIds, validateParsedFile } from './helpers';
import { ValidationError } from './errors';
import { ValidationErrorCode } from './constants/errorCodes';

/**
 * Detects duplicate rows by fingerprinting each row with per-column value IDs
 * (e.g. "C1_1C2_3") and grouping row indices that share the same fingerprint.
 * @example
 * determineDataCleanup({
 *   headers: [{ header_id: 'col', header_label: 'Col', isDuplicateName: false }],
 *   rows: [{ col: { value: 'a', data_type: 'String' } }, { col: { value: 'a', data_type: 'String' } }],
 *   colAttributes: [],
 * })
 * // => { ..., duplicateRows: { C1_1: [0, 1] } }
 */
export function determineDataCleanup(parsedFile: ParsedFile): ParsedFile {
  validateParsedFile(parsedFile);

  for (const row of parsedFile.rows) {
    for (const header of parsedFile.headers) {
      if (!(header.header_id in row)) {
        throw new ValidationError(ValidationErrorCode.MISSING_ROW_CELL);
      }
    }
  }

  const columnIds = parsedFile.headers.map((header, index) =>
    buildColumnValueIds(
      index + 1,
      parsedFile.rows.map((row) => row[header.header_id]),
    ),
  );

  const fingerprintGroups = new Map<string, number[]>();
  parsedFile.rows.forEach((_row, rowIndex) => {
    const fingerprint = columnIds.map((ids) => ids[rowIndex]).join('');
    const group = fingerprintGroups.get(fingerprint) ?? [];
    group.push(rowIndex);
    fingerprintGroups.set(fingerprint, group);
  });

  const duplicateRows: Record<string, number[]> = {};
  for (const [fingerprint, rowIndices] of fingerprintGroups) {
    if (rowIndices.length >= 2) duplicateRows[fingerprint] = rowIndices;
  }

  return { ...parsedFile, duplicateRows };
}
