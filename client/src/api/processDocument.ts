import type { ParsedFile } from '../types';

const DATE_LIKE_TYPES = new Set(['Date', 'Time', 'DateTime']);

/**
 * JSON has no Date type, so Date/Time/DateTime cell values arrive from the
 * server as ISO strings. Revive them back into Date instances using the
 * data_type tag already present on each cell.
 */
function reviveParsedFile(parsed: ParsedFile): ParsedFile {
  for (const row of parsed.rows) {
    for (const cell of Object.values(row)) {
      if (DATE_LIKE_TYPES.has(cell.data_type) && typeof cell.value === 'string') {
        cell.value = new Date(cell.value);
      }
    }
  }
  return parsed;
}

export async function processDocument(file: File): Promise<ParsedFile> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/process_document', {
    method: 'POST',
    body: formData,
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message ?? 'Failed to process document');
  }

  return reviveParsedFile(body as ParsedFile);
}
