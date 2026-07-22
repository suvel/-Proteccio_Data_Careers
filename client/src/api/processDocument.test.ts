import { afterEach, describe, expect, it, vi } from 'vitest';
import { processDocument } from './processDocument';
import type { ParsedFile } from '../types';

function mockFetchResponse(body: unknown, ok = true): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('processDocument', () => {
  it('revives a Date cell value into a Date instance', async () => {
    const parsedFile: ParsedFile = {
      headers: [{ header_id: 'signup_date', header_label: 'Signup Date', isDuplicateName: false }],
      rows: [{ signup_date: { value: '2000-01-03T00:00:00.000Z', data_type: 'Date' } }],
      colAttributes: [],
    };
    mockFetchResponse(parsedFile);

    const result = await processDocument(new File([], 'test.csv'));

    const cell = result.rows[0].signup_date;
    expect(cell.value).toBeInstanceOf(Date);
    expect((cell.value as Date).toISOString()).toBe('2000-01-03T00:00:00.000Z');
  });

  it('revives a Time cell value into a Date instance', async () => {
    const parsedFile: ParsedFile = {
      headers: [
        { header_id: 'meeting_time', header_label: 'Meeting Time', isDuplicateName: false },
      ],
      rows: [{ meeting_time: { value: '1970-01-01T14:30:00.000Z', data_type: 'Time' } }],
      colAttributes: [],
    };
    mockFetchResponse(parsedFile);

    const result = await processDocument(new File([], 'test.csv'));

    expect(result.rows[0].meeting_time.value).toBeInstanceOf(Date);
  });

  it('revives a DateTime cell value into a Date instance', async () => {
    const parsedFile: ParsedFile = {
      headers: [{ header_id: 'starts_at', header_label: 'Starts At', isDuplicateName: false }],
      rows: [{ starts_at: { value: '2023-01-15T14:30:00.000Z', data_type: 'DateTime' } }],
      colAttributes: [],
    };
    mockFetchResponse(parsedFile);

    const result = await processDocument(new File([], 'test.csv'));

    expect(result.rows[0].starts_at.value).toBeInstanceOf(Date);
  });

  it('leaves String and Number cell values untouched', async () => {
    const parsedFile: ParsedFile = {
      headers: [
        { header_id: 'name', header_label: 'Name', isDuplicateName: false },
        { header_id: 'age', header_label: 'Age', isDuplicateName: false },
      ],
      rows: [
        { name: { value: 'Alice', data_type: 'String' }, age: { value: 30, data_type: 'Number' } },
      ],
      colAttributes: [],
    };
    mockFetchResponse(parsedFile);

    const result = await processDocument(new File([], 'test.csv'));

    expect(result.rows[0].name.value).toBe('Alice');
    expect(result.rows[0].age.value).toBe(30);
  });

  it('throws with the server message when the response is not ok', async () => {
    mockFetchResponse({ message: 'Unsupported file extension' }, false);

    await expect(processDocument(new File([], 'test.txt'))).rejects.toThrow(
      'Unsupported file extension',
    );
  });
});
