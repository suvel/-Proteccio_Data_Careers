import * as path from 'path';
import { classifyDateFormat, parseFileToJson } from './parseFileToJson';
import { ParsedFile } from './types';

const fixture = (name: string) => path.join(__dirname, '__fixtures__', name);

describe('classifyDateFormat', () => {
  it.each([
    ['m/d/yy', undefined, 'Date'],
    ['yyyy-mm-dd', undefined, 'Date'],
    ['h:mm:ss', undefined, 'Time'],
    ['h:mm AM/PM', undefined, 'Time'],
    ['m/d/yy h:mm', undefined, 'DateTime'],
    ['yyyy-mm-dd hh:mm:ss', undefined, 'DateTime'],
    [undefined, '2:30 PM', 'Time'],
    [undefined, '1/15/23', 'Date'],
    [undefined, undefined, 'Date'],
    ['General', '1/15/23 2:30 PM', 'DateTime'],
  ] as const)('classifies format %p / display %p as %p', (fmt, display, expected) => {
    expect(classifyDateFormat(fmt, display)).toBe(expected);
  });
});

describe('parseFileToJson', () => {
  describe('mixed-types.csv', () => {
    let result: ParsedFile;

    beforeAll(() => {
      result = parseFileToJson(fixture('mixed-types.csv'));
    });

    it('returns headers with slugified header_id', () => {
      expect(result.headers).toEqual([
        { header_id: 'name', header_label: 'Name', isDuplicateName: false },
        { header_id: 'age', header_label: 'Age', isDuplicateName: false },
        { header_id: 'signup_date', header_label: 'Signup Date', isDuplicateName: false },
      ]);
    });

    it('infers String for a text column', () => {
      expect(result.rows[0].name).toEqual({ value: 'Alice', data_type: 'String' });
    });

    it('infers Number for a numeric column', () => {
      expect(result.rows[0].age).toEqual({ value: 30, data_type: 'Number' });
    });

    it('infers Date for a date column', () => {
      const cell = result.rows[0].signup_date;
      expect(cell.data_type).toBe('Date');
      expect(cell.value).toBeInstanceOf(Date);
      expect((cell.value as Date).toISOString().slice(0, 10)).toBe('2023-01-15');
    });

    it('maps a blank cell to a null value', () => {
      expect(result.rows[2].age).toEqual({ value: null, data_type: 'String' });
    });

    it('produces one row per data line', () => {
      expect(result.rows).toHaveLength(3);
    });
  });

  describe('date-time-types.csv', () => {
    let result: ParsedFile;

    beforeAll(() => {
      result = parseFileToJson(fixture('date-time-types.csv'));
    });

    it('infers Date for a date-only column', () => {
      const cell = result.rows[0].meeting_date;
      expect(cell.data_type).toBe('Date');
      expect((cell.value as Date).toISOString().slice(0, 10)).toBe('2023-01-15');
    });

    it('infers Time for a time-only column', () => {
      const cell = result.rows[0].meeting_time;
      expect(cell.data_type).toBe('Time');
      expect(cell.value).toBeInstanceOf(Date);
      const time = cell.value as Date;
      expect(time.getHours()).toBe(14);
      expect(time.getMinutes()).toBe(30);
    });

    it('infers DateTime for a combined date-and-time column', () => {
      const cell = result.rows[0].meeting_starts_at;
      expect(cell.data_type).toBe('DateTime');
      const value = cell.value as Date;
      expect(value.getFullYear()).toBe(2023);
      expect(value.getHours()).toBe(14);
      expect(value.getMinutes()).toBe(30);
    });
  });

  describe('duplicate-headers.csv', () => {
    let result: ParsedFile;

    beforeAll(() => {
      result = parseFileToJson(fixture('duplicate-headers.csv'));
    });

    it('marks the first occurrence of a repeated label as non-duplicate', () => {
      expect(result.headers[0]).toEqual({
        header_id: 'name',
        header_label: 'Name',
        isDuplicateName: false,
      });
    });

    it('dedupes the repeated label with old_label/label and a unique header_id', () => {
      expect(result.headers[2]).toEqual({
        header_id: 'name_2',
        header_label: 'Name_2',
        isDuplicateName: true,
        old_label: 'Name',
      });
    });

    it('keeps both columns addressable by distinct header_ids in rows', () => {
      expect(result.rows[0].name).toEqual({ value: 'Alice', data_type: 'String' });
      expect(result.rows[0].name_2).toEqual({ value: 'Wonderland', data_type: 'String' });
    });
  });

  describe('error handling', () => {
    it('throws on an unsupported file extension', () => {
      expect(() => parseFileToJson(fixture('not-a-real-file.txt'))).toThrow(
        /Unsupported file extension/,
      );
    });

    it('throws on a nonexistent file path', () => {
      expect(() => parseFileToJson(fixture('does-not-exist.csv'))).toThrow(/File not found/);
    });
  });
});
