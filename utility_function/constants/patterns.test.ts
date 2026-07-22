import {
  NUMERIC_PATTERN,
  DATE_PATTERNS,
  TIME_PATTERN,
  DATETIME_PATTERNS,
  SLUG_INVALID_CHARS_PATTERN,
  SLUG_TRIM_UNDERSCORE_PATTERN,
} from './patterns';

describe('NUMERIC_PATTERN', () => {
  it.each(['0', '42', '-7', '3.14', '-3.14', '0.5'])('matches "%s"', (value) => {
    expect(NUMERIC_PATTERN.test(value)).toBe(true);
  });

  it.each(['', 'abc', '1a', '1.2.3', '1-2', ' 1', '1 '])('rejects "%s"', (value) => {
    expect(NUMERIC_PATTERN.test(value)).toBe(false);
  });
});

describe('DATE_PATTERNS', () => {
  const matchesAny = (value: string) => DATE_PATTERNS.some((pattern) => pattern.test(value));

  it.each(['2023-01-15', '1/5/2023', '12/31/2023'])('matches "%s"', (value) => {
    expect(matchesAny(value)).toBe(true);
  });

  it.each(['', 'not-a-date', '2023/01/15', '15-01-2023', '2023-1-5'])('rejects "%s"', (value) => {
    expect(matchesAny(value)).toBe(false);
  });
});

describe('TIME_PATTERN', () => {
  it.each(['14:30', '2:30 PM', '09:05:59', '12:00 am', '0:00'])('matches "%s"', (value) => {
    expect(TIME_PATTERN.test(value)).toBe(true);
  });

  it.each(['', 'not-a-time', '24:00', '12:60', '2023-01-15', '2023-01-15 14:30'])(
    'rejects "%s"',
    (value) => {
      expect(TIME_PATTERN.test(value)).toBe(false);
    },
  );
});

describe('DATETIME_PATTERNS', () => {
  const matchesAny = (value: string) => DATETIME_PATTERNS.some((pattern) => pattern.test(value));

  it.each(['2023-01-15T14:30', '2023-01-15T14:30:00', '2023-01-15 14:30:00Z', '1/15/2023 2:30 PM'])(
    'matches "%s"',
    (value) => {
      expect(matchesAny(value)).toBe(true);
    },
  );

  it.each(['', 'not-a-datetime', '2023-01-15', '14:30', '1/15/2023'])('rejects "%s"', (value) => {
    expect(matchesAny(value)).toBe(false);
  });
});

describe('slugify regexes', () => {
  const slugify = (label: string) =>
    label
      .toLowerCase()
      .trim()
      .replace(SLUG_INVALID_CHARS_PATTERN, '_')
      .replace(SLUG_TRIM_UNDERSCORE_PATTERN, '') || 'column';

  it('replaces non-alphanumeric runs with a single underscore', () => {
    expect(slugify('Signup Date!')).toBe('signup_date');
  });

  it('trims leading and trailing underscores', () => {
    expect(slugify('  %Age%  ')).toBe('age');
  });

  it('falls back to "column" when nothing alphanumeric remains', () => {
    expect(slugify('###')).toBe('column');
  });
});
