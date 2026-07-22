export const NUMERIC_PATTERN = /^-?\d+(\.\d+)?$/;
export const DATE_PATTERNS = [/^\d{4}-\d{2}-\d{2}$/, /^\d{1,2}\/\d{1,2}\/\d{4}$/];
export const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?\s?([AaPp][Mm])?$/;
export const DATETIME_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}[T ]\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/,
  /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}(:\d{2})?\s?([AaPp][Mm])?$/,
];
export const SLUG_INVALID_CHARS_PATTERN = /[^a-z0-9]+/g;
export const SLUG_TRIM_UNDERSCORE_PATTERN = /^_+|_+$/g;

export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_PATTERN = /^(?:\+91|0)?[6-9]\d{9}$/;
export const NAME_PATTERN = /^[A-Z][a-zA-Z.\-']+(?:\s+[A-Z][a-zA-Z.\-']+)+$/;
export const AADHAR_PATTERN = /^[2-9]\d{11}$/;
export const PAN_PATTERN = /^[A-Z]{3}P[A-Z]\d{4}[A-Z]$/;
export const VOTER_PATTERN = /^[A-Z]{3}\d{7}$/;
export const BANK_CARD_PATTERN = /^(?:\d[ -]*?){13,19}$/;
export const BLOOD_GROUP_PATTERN = /^(A|B|AB|O)\s?[+-]$/i;

export interface SensitivePattern {
  name: string;
  pattern: RegExp;
}

export const SENSITIVE_DATA_PATTERNS: SensitivePattern[] = [
  { name: 'Email', pattern: EMAIL_PATTERN },
  { name: 'Phone Number', pattern: PHONE_PATTERN },
  { name: 'Full Name', pattern: NAME_PATTERN },
  { name: 'Aadhaar Number', pattern: AADHAR_PATTERN },
  { name: 'PAN Number', pattern: PAN_PATTERN },
  { name: 'Voter ID', pattern: VOTER_PATTERN },
  { name: 'Bank Card Number', pattern: BANK_CARD_PATTERN },
  { name: 'Blood Group', pattern: BLOOD_GROUP_PATTERN },
];

export const MISSING_DATA_VALUES = ['-', 'null'];
