import * as path from 'path';
import { checkDataQuality } from './checkDataQuality';
import { parseFileToJson } from './parseFileToJson';
import { Cell, ParsedFile } from './types';
import { ValidationError } from './errors';
import { ValidationErrorCode } from './constants/errorCodes';

const fixture = (name: string) => path.join(__dirname, '__fixtures__', name);

const wrap = (value: Cell['value']): ParsedFile => ({
  headers: [{ header_id: 'col', header_label: 'Col', isDuplicateName: false }],
  rows: [{ col: { value, data_type: 'String' } }],
  colAttributes: [],
});

const flagsFor = (value: Cell['value']) => checkDataQuality(wrap(value)).rows[0].col;

describe('checkDataQuality - sensitive data', () => {
  describe('email', () => {
    it.each(['jane.doe@example.com', 'john+work@sub.domain.co.in'])('flags "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBe(true);
      expect(flagsFor(value).sensitive_pattern).toBe('Email');
    });

    it.each(['not-an-email', 'missing-at-sign.com'])('does not flag "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBeUndefined();
      expect(flagsFor(value).sensitive_pattern).toBeUndefined();
    });
  });

  describe('phone number', () => {
    it.each(['+919876543210', '09876543210', '9876543210'])('flags "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBe(true);
      expect(flagsFor(value).sensitive_pattern).toBe('Phone Number');
    });

    it.each(['5876543210', '98765432', 'not-a-phone'])('does not flag "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBeUndefined();
      expect(flagsFor(value).sensitive_pattern).toBeUndefined();
    });
  });

  describe('name', () => {
    it.each(['John Smith', 'John K. Smith', "Mary-Jane O'Brien"])('flags "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBe(true);
      expect(flagsFor(value).sensitive_pattern).toBe('Full Name');
    });

    it.each(['John', 'john smith', '123 456'])('does not flag "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBeUndefined();
      expect(flagsFor(value).sensitive_pattern).toBeUndefined();
    });
  });

  describe('Aadhaar number', () => {
    it.each(['298765432109'])('flags "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBe(true);
      expect(flagsFor(value).sensitive_pattern).toBe('Aadhaar Number');
    });

    it.each(['198765432109', '12345'])('does not flag "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBeUndefined();
      expect(flagsFor(value).sensitive_pattern).toBeUndefined();
    });
  });

  describe('PAN number', () => {
    it.each(['ABCPD1234E'])('flags "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBe(true);
      expect(flagsFor(value).sensitive_pattern).toBe('PAN Number');
    });

    it.each(['ABCDE1234F', 'abcpd1234e'])('does not flag "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBeUndefined();
      expect(flagsFor(value).sensitive_pattern).toBeUndefined();
    });
  });

  describe('voter ID', () => {
    it.each(['ABC1234567'])('flags "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBe(true);
      expect(flagsFor(value).sensitive_pattern).toBe('Voter ID');
    });

    it.each(['AB1234567', 'ABC12345'])('does not flag "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBeUndefined();
      expect(flagsFor(value).sensitive_pattern).toBeUndefined();
    });
  });

  describe('bank card number', () => {
    it.each(['4111 1111 1111 1111', '4111-1111-1111-1111', '4111111111111111'])(
      'flags "%s"',
      (value) => {
        expect(flagsFor(value).sensitive_data).toBe(true);
        expect(flagsFor(value).sensitive_pattern).toBe('Bank Card Number');
      },
    );

    it.each(['1234567', 'not-a-card'])('does not flag "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBeUndefined();
      expect(flagsFor(value).sensitive_pattern).toBeUndefined();
    });
  });

  describe('blood group', () => {
    it.each(['A+', 'AB-', 'o+', 'B +'])('flags "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBe(true);
      expect(flagsFor(value).sensitive_pattern).toBe('Blood Group');
    });

    it.each(['C+', 'A', '+A'])('does not flag "%s"', (value) => {
      expect(flagsFor(value).sensitive_data).toBeUndefined();
      expect(flagsFor(value).sensitive_pattern).toBeUndefined();
    });
  });

  it('does not check non-string values', () => {
    expect(flagsFor(42).sensitive_data).toBeUndefined();
    expect(flagsFor(new Date('2023-01-01')).sensitive_data).toBeUndefined();
  });
});

describe('checkDataQuality - missing data', () => {
  it.each([null, '', '-', 'null', '  '])('flags %p as missing', (value) => {
    expect(flagsFor(value).missing_data).toBe(true);
  });

  it.each(['Alice', 0, new Date('2023-01-01')])('does not flag %p as missing', (value) => {
    expect(flagsFor(value as Cell['value']).missing_data).toBeUndefined();
  });
});

describe('checkDataQuality - immutability', () => {
  it('does not mutate the input ParsedFile or its cells', () => {
    const input = wrap('jane.doe@example.com');
    const originalCell = input.rows[0].col;
    const result = checkDataQuality(input);

    expect(input.rows[0].col.sensitive_data).toBeUndefined();
    expect(result.rows[0].col).not.toBe(originalCell);
    expect(result).not.toBe(input);
  });
});

describe('checkDataQuality - input validation', () => {
  it('throws ValidationError(INVALID_PARSED_FILE) for undefined input', () => {
    try {
      checkDataQuality(undefined as unknown as ParsedFile);
      throw new Error('expected checkDataQuality to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_PARSED_FILE);
    }
  });

  it('throws ValidationError(INVALID_HEADERS) when headers is not an array', () => {
    const parsed = {
      headers: 'not-an-array',
      rows: [],
      colAttributes: [],
    } as unknown as ParsedFile;
    try {
      checkDataQuality(parsed);
      throw new Error('expected checkDataQuality to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_HEADERS);
    }
  });

  it('throws ValidationError(INVALID_ROWS) when rows is not an array', () => {
    const parsed = {
      headers: [],
      rows: 'not-an-array',
      colAttributes: [],
    } as unknown as ParsedFile;
    try {
      checkDataQuality(parsed);
      throw new Error('expected checkDataQuality to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe(ValidationErrorCode.INVALID_ROWS);
    }
  });
});

describe('checkDataQuality - integration with parseFileToJson', () => {
  let result: ParsedFile;

  beforeAll(() => {
    const parsed = parseFileToJson(fixture('sensitive-data.csv'));
    result = checkDataQuality(parsed);
  });

  it('flags a name cell as sensitive', () => {
    expect(result.rows[0].full_name).toEqual({
      value: 'John Smith',
      data_type: 'String',
      sensitive_data: true,
      sensitive_pattern: 'Full Name',
    });
  });

  it('flags an email cell as sensitive', () => {
    expect(result.rows[0].email.sensitive_data).toBe(true);
    expect(result.rows[0].email.sensitive_pattern).toBe('Email');
  });

  it('flags a phone cell as sensitive', () => {
    expect(result.rows[0].phone.sensitive_data).toBe(true);
    expect(result.rows[0].phone.sensitive_pattern).toBe('Phone Number');
  });

  it('flags a "-" notes cell as missing data', () => {
    expect(result.rows[0].notes).toEqual({ value: '-', data_type: 'String', missing_data: true });
  });

  it('does not flag a non-sensitive, non-missing cell', () => {
    expect(result.rows[1].notes).toEqual({ value: 'Regular note', data_type: 'String' });
  });

  it('does not flag an invalid email as sensitive', () => {
    expect(result.rows[1].email.sensitive_data).toBeUndefined();
  });
});
