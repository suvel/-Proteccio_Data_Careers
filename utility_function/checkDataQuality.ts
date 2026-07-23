import { Cell, ParsedFile, Row } from './types';
import { SENSITIVE_DATA_PATTERNS } from './constants/patterns';
import { checkDataCompleteness } from './checkDataCompleteness';
import { isMissingData, validateParsedFile } from './helpers';

function findSensitivePattern(value: Cell['value']): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return SENSITIVE_DATA_PATTERNS.find(({ pattern }) => pattern.test(trimmed))?.name;
}

function evaluateCell(cell: Cell): Cell {
  const result: Cell = { ...cell };
  const matchedPattern = findSensitivePattern(cell.value);
  if (matchedPattern) {
    result.sensitive_data = true;
    result.sensitive_pattern = matchedPattern;
  }
  if (isMissingData(cell.value)) result.missing_data = true;
  return result;
}

export function checkDataQuality(parsedFile: ParsedFile): ParsedFile {
  validateParsedFile(parsedFile);
  const rows: Row[] = parsedFile.rows.map((row) => {
    const newRow: Row = {};
    for (const headerId of Object.keys(row)) {
      newRow[headerId] = evaluateCell(row[headerId]);
    }
    return newRow;
  });
  const colAttributes = checkDataCompleteness({
    headers: parsedFile.headers,
    rows,
    colAttributes: [],
    download_count: parsedFile.download_count,
  });
  return {
    headers: parsedFile.headers,
    rows,
    colAttributes,
    download_count: parsedFile.download_count,
  };
}
