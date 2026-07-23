import { afterEach, describe, expect, it, vi } from 'vitest';
import { storeTable, listStoredTables, deleteStoredTable } from './storedTables';
import type { ParsedFile, StoredTable } from '../types';

function mockFetchResponse(body: unknown, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const parsedFile: ParsedFile = {
  headers: [{ header_id: 'signup_date', header_label: 'Signup Date', isDuplicateName: false }],
  rows: [{ signup_date: { value: '2000-01-03T00:00:00.000Z', data_type: 'Date' } }],
  colAttributes: [],
};

describe('storeTable', () => {
  it('revives Date/Time/DateTime cell values in the returned tableObject', async () => {
    const stored: StoredTable = { id: '1', title: 'Q1', tableObject: parsedFile };
    mockFetchResponse(stored);

    const result = await storeTable('Q1', parsedFile);

    expect(result.tableObject.rows[0].signup_date.value).toBeInstanceOf(Date);
  });

  it('throws with the server message when the response is not ok', async () => {
    mockFetchResponse({ message: 'Title is required' }, false);

    await expect(storeTable('', parsedFile)).rejects.toThrow('Title is required');
  });
});

describe('listStoredTables', () => {
  it('revives dates across multiple returned tables', async () => {
    const stored: StoredTable[] = [
      { id: '1', title: 'Q1', tableObject: parsedFile },
      { id: '2', title: 'Q2', tableObject: parsedFile },
    ];
    mockFetchResponse(stored);

    const result = await listStoredTables();

    expect(result).toHaveLength(2);
    expect(result[0].tableObject.rows[0].signup_date.value).toBeInstanceOf(Date);
    expect(result[1].tableObject.rows[0].signup_date.value).toBeInstanceOf(Date);
  });

  it('throws with the server message when the response is not ok', async () => {
    mockFetchResponse({ message: 'Failed to load' }, false);

    await expect(listStoredTables()).rejects.toThrow('Failed to load');
  });
});

describe('deleteStoredTable', () => {
  it('resolves without attempting to parse a body on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('should not be called')),
      }),
    );

    await expect(deleteStoredTable('1')).resolves.toBeUndefined();
  });

  it('throws with the server message when the response is not ok', async () => {
    mockFetchResponse({ message: 'Table not found' }, false, 404);

    await expect(deleteStoredTable('missing')).rejects.toThrow('Table not found');
  });
});
