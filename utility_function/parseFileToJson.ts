import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Cell, DataType, Header, ParsedFile, Row } from './types';
import { SUPPORTED_EXTENSIONS } from './constants/config';
import {
  NUMERIC_PATTERN,
  DATE_PATTERNS,
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

function inferCell(raw: unknown): Cell {
  if (raw === null || raw === undefined) {
    return { value: null, data_type: 'String' };
  }

  if (raw instanceof Date) {
    return { value: raw, data_type: 'Date' };
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

    if (DATE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return { value: parsed, data_type: 'Date' };
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

  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rowsAoA = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  if (rowsAoA.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...dataRows] = rowsAoA;
  const headers = buildHeaders(headerRow);

  const rows: Row[] = dataRows.map((dataRow) => {
    const row: Row = {};
    headers.forEach((header, index) => {
      row[header.header_id] = inferCell(dataRow[index]);
    });
    return row;
  });

  return { headers, rows };
}
