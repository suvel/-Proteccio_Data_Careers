import { Cell, ParsedFile, Row } from './types';
import { SENSITIVE_DATA_PATTERNS, MISSING_DATA_VALUES } from './constants/patterns';

function isSensitiveData(value: Cell['value']): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return SENSITIVE_DATA_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isMissingData(value: Cell['value']): boolean {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed === '' || MISSING_DATA_VALUES.includes(trimmed);
}

function evaluateCell(cell: Cell): Cell {
  const result: Cell = { ...cell };
  if (isSensitiveData(cell.value)) result.sensitive_data = true;
  if (isMissingData(cell.value)) result.missing_data = true;
  return result;
}

export function checkDataQuality(parsedFile: ParsedFile): ParsedFile {
  const rows: Row[] = parsedFile.rows.map((row) => {
    const newRow: Row = {};
    for (const headerId of Object.keys(row)) {
      newRow[headerId] = evaluateCell(row[headerId]);
    }
    return newRow;
  });
  return { headers: parsedFile.headers, rows };
}
