# Regex Patterns

Defined in [patterns.ts](./patterns.ts).

## NUMERIC_PATTERN

```
/^-?\d+(\.\d+)?$/
```

Matches an optionally-negative integer or decimal string.

| Input | Result | Reason |
|---|---|---|
| `0` | Pass | integer |
| `42` | Pass | integer |
| `-7` | Pass | negative integer |
| `3.14` | Pass | decimal |
| `-3.14` | Pass | negative decimal |
| `0.5` | Pass | decimal |
| `` (empty string) | Fail | no digits |
| `abc` | Fail | not numeric |
| `1a` | Fail | trailing non-digit |
| `1.2.3` | Fail | multiple decimal points |
| `1-2` | Fail | invalid separator |
| ` 1` | Fail | leading whitespace |
| `1 ` | Fail | trailing whitespace |

## DATE_PATTERNS

```
[/^\d{4}-\d{2}-\d{2}$/, /^\d{1,2}\/\d{1,2}\/\d{4}$/]
```

Matches either ISO `YYYY-MM-DD` or `M/D/YYYY` (`MM/DD/YYYY`) formatted dates.

| Input | Result | Reason |
|---|---|---|
| `2023-01-15` | Pass | matches `YYYY-MM-DD` |
| `1/5/2023` | Pass | matches `M/D/YYYY` |
| `12/31/2023` | Pass | matches `MM/DD/YYYY` |
| `` (empty string) | Fail | no digits |
| `not-a-date` | Fail | not numeric |
| `2023/01/15` | Fail | wrong separator for ISO format |
| `15-01-2023` | Fail | wrong order for ISO format |
| `2023-1-5` | Fail | ISO format requires 2-digit month/day |

## SLUG_INVALID_CHARS_PATTERN

```
/[^a-z0-9]+/g
```

Matches one or more consecutive characters that are not lowercase letters or digits (used to collapse them into a single underscore).

| Input | Result | Reason |
|---|---|---|
| `signup date` | Pass (matches ` `) | space is non-alphanumeric |
| `age!` | Pass (matches `!`) | `!` is non-alphanumeric |
| `%%%` | Pass (matches `%%%`) | run of non-alphanumeric chars |
| `signupdate` | Fail (no match) | all lowercase letters |
| `abc123` | Fail (no match) | all lowercase letters/digits |

## SLUG_TRIM_UNDERSCORE_PATTERN

```
/^_+|_+$/g
```

Matches leading and/or trailing runs of underscores (used to trim them after slugification).

| Input | Result | Reason |
|---|---|---|
| `_age` | Pass (matches leading `_`) | leading underscore |
| `age_` | Pass (matches trailing `_`) | trailing underscore |
| `__age__` | Pass (matches both ends) | leading and trailing underscores |
| `age` | Fail (no match) | no leading/trailing underscores |
| `a_g_e` | Fail (no match) | underscores only in the middle |

## EMAIL_PATTERN

```
/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
```

Matches a standard email address.

| Input | Result | Reason |
|---|---|---|
| `jane.doe@example.com` | Pass | valid email |
| `john+work@sub.domain.co.in` | Pass | valid email with subdomain and `+` tag |
| `not-an-email` | Fail | no `@` |
| `missing-at-sign.com` | Fail | no `@` |

## PHONE_PATTERN

```
/^(?:\+91|0)?[6-9]\d{9}$/
```

Matches a 10-digit Indian mobile number, with an optional `+91` or leading `0` prefix.

| Input | Result | Reason |
|---|---|---|
| `+919876543210` | Pass | `+91` prefix + valid 10-digit number |
| `09876543210` | Pass | `0` prefix + valid 10-digit number |
| `9876543210` | Pass | bare 10-digit number starting 6-9 |
| `5876543210` | Fail | first digit not 6-9 |
| `98765432` | Fail | too short |

## NAME_PATTERN

```
/^[A-Z][a-zA-Z.\-']+(?:\s+[A-Z][a-zA-Z.\-']+)+$/
```

Matches a full name (two or more capitalized words), including initials and hyphenated/apostrophe surnames.

| Input | Result | Reason |
|---|---|---|
| `John Smith` | Pass | first + last name |
| `John K. Smith` | Pass | first name + initial + last name |
| `Mary-Jane O'Brien` | Pass | hyphenated first name + apostrophe surname |
| `John` | Fail | single word, no second capitalized word |
| `john smith` | Fail | not capitalized |

## AADHAR_PATTERN

```
/^[2-9]\d{11}$/
```

Matches a 12-digit Aadhaar number that does not start with 0 or 1.

| Input | Result | Reason |
|---|---|---|
| `298765432109` | Pass | 12 digits, starts with 2 |
| `198765432109` | Fail | starts with 1 |
| `12345` | Fail | too short |

## PAN_PATTERN

```
/^[A-Z]{3}P[A-Z]\d{4}[A-Z]$/
```

Matches a PAN number (3 letters, literal `P`, 1 letter, 4 digits, 1 letter).

| Input | Result | Reason |
|---|---|---|
| `ABCPD1234E` | Pass | matches PAN format |
| `ABCDE1234F` | Fail | 4th character is not `P` |
| `abcpd1234e` | Fail | lowercase |

## VOTER_PATTERN

```
/^[A-Z]{3}\d{7}$/
```

Matches a Voter ID (3 letters followed by 7 digits).

| Input | Result | Reason |
|---|---|---|
| `ABC1234567` | Pass | 3 letters + 7 digits |
| `AB1234567` | Fail | only 2 letters |
| `ABC12345` | Fail | only 5 digits |

## BANK_CARD_PATTERN

```
/^(?:\d[ -]*?){13,19}$/
```

Matches a 13-19 digit bank card number, optionally separated by spaces or dashes.

| Input | Result | Reason |
|---|---|---|
| `4111 1111 1111 1111` | Pass | 16 digits, space-separated |
| `4111-1111-1111-1111` | Pass | 16 digits, dash-separated |
| `4111111111111111` | Pass | 16 digits, no separators |
| `1234567` | Fail | fewer than 13 digits |
| `not-a-card` | Fail | not numeric |

## BLOOD_GROUP_PATTERN

```
/^(A|B|AB|O)\s?[+-]$/i
```

Matches a blood group (A, B, AB, or O) with an Rh factor, case-insensitive, with an optional space before the sign.

| Input | Result | Reason |
|---|---|---|
| `A+` | Pass | valid blood group |
| `AB-` | Pass | valid blood group |
| `o+` | Pass | case-insensitive match |
| `B +` | Pass | optional space before sign |
| `C+` | Fail | `C` is not a valid blood group |
| `A` | Fail | missing Rh sign |

## MISSING_DATA_VALUES

```
['-', 'null']
```

Sentinel string values (after trimming) that, alongside an empty string or `null`, are treated as missing data by [checkDataQuality.ts](../checkDataQuality.ts).

## Verification

These pass/fail cases are exercised by the unit tests in [patterns.test.ts](./patterns.test.ts) and [checkDataQuality.test.ts](../checkDataQuality.test.ts).
