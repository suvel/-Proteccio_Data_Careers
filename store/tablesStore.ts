import { ParsedFile } from '../utility_function/types';
import { supabase, STORED_TABLES_TABLE } from '../lib/supabaseClient';

export interface StoredTable {
  id: string;
  title: string;
  tableObject: ParsedFile;
}

interface StoredTableRow {
  id: string;
  title: string;
  tableObject: ParsedFile;
}

export async function addTable(title: string, tableObject: ParsedFile): Promise<StoredTable> {
  const { data, error } = await supabase
    .from(STORED_TABLES_TABLE)
    .insert({ title, tableObject })
    .select('id, title, tableObject')
    .single();
  if (error) {
    console.log({ error });
    throw error;
  }

  return data as StoredTableRow;
}

export async function listTables(): Promise<StoredTable[]> {
  const { data: rows, error } = await supabase
    .from(STORED_TABLES_TABLE)
    .select('id, title, tableObject')
    .order('created_at', { ascending: true });
  if (error) {
    throw error;
  }

  return rows as StoredTableRow[];
}

export async function incrementDownloadCount(id: string): Promise<StoredTable | null> {
  const { data: existing, error: fetchError } = await supabase
    .from(STORED_TABLES_TABLE)
    .select('id, title, tableObject')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) {
    throw fetchError;
  }
  if (!existing) {
    return null;
  }

  const row = existing as StoredTableRow;
  const tableObject: ParsedFile = {
    ...row.tableObject,
    download_count: (row.tableObject.download_count ?? 0) + 1,
  };

  const { data, error } = await supabase
    .from(STORED_TABLES_TABLE)
    .update({ tableObject })
    .eq('id', id)
    .select('id, title, tableObject')
    .single();
  if (error) {
    throw error;
  }

  return data as StoredTableRow;
}

export async function deleteTable(id: string): Promise<boolean> {
  const { data: deletedRows, error } = await supabase
    .from(STORED_TABLES_TABLE)
    .delete()
    .eq('id', id)
    .select('id');
  if (error) {
    throw error;
  }

  return (deletedRows as StoredTableRow[]).length > 0;
}

export async function clearTables(): Promise<void> {
  const { data: rows, error } = await supabase.from(STORED_TABLES_TABLE).select('id');
  if (error) {
    throw error;
  }

  const ids = (rows as StoredTableRow[]).map((row) => row.id);
  if (ids.length === 0) {
    return;
  }

  await supabase.from(STORED_TABLES_TABLE).delete().in('id', ids);
}
