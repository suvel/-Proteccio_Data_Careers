import type { ParsedFile, StoredTable } from '../types';
import { reviveParsedFile } from './processDocument';

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function storeTable(title: string, tableObject: ParsedFile): Promise<StoredTable> {
  const response = await fetch('/table', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, tableObject }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to store table'));
  }

  const stored = (await response.json()) as StoredTable;
  return { ...stored, tableObject: reviveParsedFile(stored.tableObject) };
}

export async function listStoredTables(): Promise<StoredTable[]> {
  const response = await fetch('/table');

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load stored tables'));
  }

  const stored = (await response.json()) as StoredTable[];
  return stored.map((table) => ({ ...table, tableObject: reviveParsedFile(table.tableObject) }));
}

export async function deleteStoredTable(id: string): Promise<void> {
  const response = await fetch(`/table/${id}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to delete stored table'));
  }
}
