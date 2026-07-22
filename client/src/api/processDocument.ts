import type { ParsedFile } from '../types';

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

  return body as ParsedFile;
}
