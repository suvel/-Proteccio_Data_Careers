import { randomUUID } from 'crypto';
import { ParsedFile } from '../utility_function/types';

export interface StoredTable {
  id: string;
  title: string;
  tableObject: ParsedFile;
}

const tables = new Map<string, StoredTable>();

export function addTable(title: string, tableObject: ParsedFile): StoredTable {
  const table: StoredTable = { id: randomUUID(), title, tableObject };
  tables.set(table.id, table);
  return table;
}

export function listTables(): StoredTable[] {
  return Array.from(tables.values());
}

export function deleteTable(id: string): boolean {
  return tables.delete(id);
}

export function clearTables(): void {
  tables.clear();
}
