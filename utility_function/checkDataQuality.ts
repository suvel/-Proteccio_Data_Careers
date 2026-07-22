import { Cell, ParsedFile, Row } from './types';
import { SENSITIVE_DATA_PATTERNS } from './constants/patterns';
import { checkDataCompleteness } from './checkDataCompleteness';
import { isMissingData } from './helpers';

function isSensitiveData(value: Cell['value']): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return SENSITIVE_DATA_PATTERNS.some((pattern) => pattern.test(trimmed));
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
  const colAttributes = checkDataCompleteness({ headers: parsedFile.headers, rows, colAttributes: [] });
  return { headers: parsedFile.headers, rows, colAttributes };
}
