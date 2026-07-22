import { ParsedFile } from './types';
import { buildColumnValueIds } from './helpers';

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
  const columnIds = parsedFile.headers.map((header, index) =>
    buildColumnValueIds(
      index + 1,
      parsedFile.rows.map((row) => row[header.header_id])
    )
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
