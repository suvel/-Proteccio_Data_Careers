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

## Verification

These pass/fail cases are exercised by the unit tests in [patterns.test.ts](./patterns.test.ts).
