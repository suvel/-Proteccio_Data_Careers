import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Cell, DataType, Header, ParsedFile, Row } from './types';
import { SUPPORTED_EXTENSIONS } from './constants/config';
import {
  NUMERIC_PATTERN,
  DATE_PATTERNS,
  TIME_PATTERN,
  DATETIME_PATTERNS,
  SLUG_INVALID_CHARS_PATTERN,
  SLUG_TRIM_UNDERSCORE_PATTERN,
} from './constants/patterns';

function slugify(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(SLUG_INVALID_CHARS_PATTERN, '_')
    .replace(SLUG_TRIM_UNDERSCORE_PATTERN, '');
  return slug || 'column';
}

function buildHeaders(headerRow: unknown[]): Header[] {
  const occurrences = new Map<string, number>();

  return headerRow.map((raw, index) => {
    const rawLabel = raw === null || raw === undefined ? '' : String(raw).trim();
    const header_label = rawLabel === '' ? `column_${index + 1}` : rawLabel;

    const seen = occurrences.get(header_label) ?? 0;
    occurrences.set(header_label, seen + 1);

    if (seen === 0) {
      return {
        header_id: slugify(header_label),
        header_label,
        isDuplicateName: false,
      };
    }

    const serial = seen + 1;
    const label = `${header_label}_${serial}`;
    return {
      header_id: slugify(label),
      header_label: label,
      isDuplicateName: true,
      old_label: header_label
    };
  });
}

/**
 * Parses a bare time-of-day string (e.g. "14:30", "2:30:15 PM") into a Date
 * anchored at the Unix epoch date, since a time value has no date component.
 */
function parseTimeString(trimmed: string): Date | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?\s?([AaPp][Mm])?$/.exec(trimmed);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;
  const meridiem = match[4]?.toLowerCase();

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'am') hours = hours === 12 ? 0 : hours;
    else hours = hours === 12 ? 12 : hours + 12;
  }

  return new Date(1970, 0, 1, hours, minutes, seconds);
}

/**
 * Classifies an Excel number-format code (and/or its formatted display text)
 * as Date, Time, or DateTime based on the presence of date/time tokens.
 * @example
 * classifyDateFormat('h:mm:ss', undefined) // => 'Time'
 * @example
 * classifyDateFormat('m/d/yy h:mm', undefined) // => 'DateTime'
 * @example
 * classifyDateFormat(undefined, undefined) // => 'Date'
 */
export function classifyDateFormat(fmt: string | undefined, fallbackDisplay: string | undefined): 'Date' | 'Time' | 'DateTime' {
  if (fmt && fmt !== 'General') {
    const stripped = fmt.replace(/\[.*?\]/g, '');
    const hasTimeTokens = /[hHsS]/.test(stripped) || /am\/pm/i.test(stripped);
    const hasDateTokens = /[yYdD]/.test(stripped);

    if (hasTimeTokens && hasDateTokens) return 'DateTime';
    if (hasTimeTokens) return 'Time';
    return 'Date';
  }

  if (fallbackDisplay) {
    const hasTimeText = /:/.test(fallbackDisplay) || /\b(am|pm)\b/i.test(fallbackDisplay);
    const hasDateText = /[/-]/.test(fallbackDisplay) || /\d{4}/.test(fallbackDisplay);

    if (hasTimeText && hasDateText) return 'DateTime';
    if (hasTimeText) return 'Time';
  }

  return 'Date';
}

function inferCell(raw: unknown, cellMeta?: { z?: string; w?: string }): Cell {
  if (raw === null || raw === undefined) {
    return { value: null, data_type: 'String' };
  }

  if (raw instanceof Date) {
    return { value: raw, data_type: classifyDateFormat(cellMeta?.z, cellMeta?.w) };
  }

  if (typeof raw === 'number') {
    return { value: raw, data_type: 'Number' };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();

    if (trimmed === '') {
      return { value: null, data_type: 'String' };
    }

    if (NUMERIC_PATTERN.test(trimmed)) {
      return { value: Number(trimmed), data_type: 'Number' };
    }

    if (DATETIME_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return { value: parsed, data_type: 'DateTime' };
      }
    }

    if (DATE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return { value: parsed, data_type: 'Date' };
      }
    }

    if (TIME_PATTERN.test(trimmed)) {
      const parsed = parseTimeString(trimmed);
      if (parsed) {
        return { value: parsed, data_type: 'Time' };
      }
    }

    return { value: raw, data_type: 'String' };
  }

  return { value: String(raw), data_type: 'String' as DataType };
}

export function parseFileToJson(filePath: string): ParsedFile {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `Unsupported file extension "${ext}". Expected one of: ${[...SUPPORTED_EXTENSIONS].join(', ')}`
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath, { cellDates: true, raw: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rowsAoA = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  if (rowsAoA.length === 0) {
    return { headers: [], rows: [], colAttributes: [] };
  }

  const [headerRow, ...dataRows] = rowsAoA;
  const headers = buildHeaders(headerRow);

  const rows: Row[] = dataRows.map((dataRow, rowIndex) => {
    const row: Row = {};
    headers.forEach((header, colIndex) => {
      const addr = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
      const sheetCell = sheet[addr] as { z?: string; w?: string } | undefined;
      row[header.header_id] = inferCell(dataRow[colIndex], sheetCell);
    });
    return row;
  });

  return { headers, rows, colAttributes: [] };
}
