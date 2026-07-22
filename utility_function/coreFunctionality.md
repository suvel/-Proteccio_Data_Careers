# `helpers.ts` — Core Functionality Reference

This document describes every function exported from [helpers.ts](helpers.ts), grouped by the data-check category it supports:

- **Data Quality** — is a value missing, blank, or a placeholder? (feeds `checkDataQuality.ts`)
- **Data Completeness** — given the valid, non-missing values in a column, what do they look like statistically (spread, bias, coverage, range, top-frequency)? (feeds `checkDataCompleteness.ts`)

For each function: purpose, signature, and a good (expected/valid) case plus a bad (edge/invalid) case.

---

## Data Quality

### `isMissingData(value: Cell['value']): boolean`

Determines whether a single cell value should be treated as missing. A value is missing if it is `null`, an empty/whitespace-only string, or one of the configured placeholder strings (`MISSING_DATA_VALUES = ['-', 'null']`, case-sensitive, trimmed).

| Case          | Input                    | Output  | Notes                                                                                                                |
| ------------- | ------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------- |
| ✅ Good       | `isMissingData('Alice')` | `false` | Ordinary non-empty string is not missing.                                                                            |
| ✅ Good       | `isMissingData(null)`    | `true`  | `null` is always missing.                                                                                            |
| ✅ Good       | `isMissingData('-')`     | `true`  | Matches a configured placeholder value.                                                                              |
| ✅ Good       | `isMissingData('  ')`    | `true`  | Whitespace-only string is treated as blank/missing.                                                                  |
| ❌ Bad / edge | `isMissingData(0)`       | `false` | Numeric `0` is **not** missing — only `null` and strings are considered; a naive falsy check would wrongly flag `0`. |
| ❌ Bad / edge | `isMissingData('Null')`  | `false` | Placeholder matching is case-sensitive, so `'Null'` (capital N) is **not** recognized as missing, unlike `'null'`.   |

---

## Data Completeness

### `mostCommonDataType(cells: Cell[]): DataType`

Returns the `DataType` (`'String' | 'Number' | 'Date'`) that appears most often across a set of cells, used to decide how the rest of the column should be analyzed.

| Case          | Input                                                                                                              | Output     | Notes                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Good       | `mostCommonDataType([{value:1,data_type:'Number'}, {value:2,data_type:'Number'}, {value:'x',data_type:'String'}])` | `'Number'` | Majority type wins (2 Number vs 1 String).                                                                                                                                                                      |
| ✅ Good       | `mostCommonDataType([{value:'a',data_type:'String'}])`                                                             | `'String'` | Single cell — its type wins trivially.                                                                                                                                                                          |
| ❌ Bad / edge | `mostCommonDataType([])`                                                                                           | `'String'` | Empty input has no majority type; falls back to the `'String'` default rather than throwing.                                                                                                                    |
| ❌ Bad / edge | `mostCommonDataType([{value:1,data_type:'Number'}, {value:'a',data_type:'String'}])`                               | `'Number'` | Exact tie (1 vs 1) resolves to whichever type was iterated first — result is dependent on insertion order, not a defined tie-break rule. Callers relying on deterministic tie behavior should be aware of this. |

### `standardDeviation(values: number[]): number`

Computes the **population** standard deviation (divides by `n`, not `n-1`) of a plain array of numbers.

| Case          | Input                                         | Output | Notes                                                                                                                                                                                                        |
| ------------- | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ✅ Good       | `standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])` | `2`    | Standard textbook example.                                                                                                                                                                                   |
| ✅ Good       | `standardDeviation([5])`                      | `0`    | Single value has zero spread.                                                                                                                                                                                |
| ❌ Bad / edge | `standardDeviation([])`                       | `NaN`  | Dividing by `values.length === 0` produces `NaN`; caller must never invoke this with an empty array (guarded upstream by `computeStandardDeviationForCells`, which only calls it when `numbers.length > 0`). |

### `biasBucketKey(dataType: DataType, value: Cell['value']): string | null`

Maps one cell's value to the "bucket" used for bias counting: sign (`'positive' | 'negative' | 'zero'`) for numbers, year (as a string) for dates, the exact string for strings. Returns `null` when the value's runtime type doesn't match the declared `dataType`.

| Case          | Input                                           | Output       | Notes                                                                                                              |
| ------------- | ----------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| ✅ Good       | `biasBucketKey('Number', -5)`                   | `'negative'` | Negative number buckets correctly.                                                                                 |
| ✅ Good       | `biasBucketKey('Date', new Date('2022-06-01'))` | `'2022'`     | Buckets by calendar year.                                                                                          |
| ✅ Good       | `biasBucketKey('String', 'Apple')`              | `'Apple'`    | String buckets by its own value.                                                                                   |
| ❌ Bad / edge | `biasBucketKey('Number', 'not-a-number')`       | `null`       | Value's actual type doesn't match `dataType` — guards against mixed-type columns silently producing wrong buckets. |
| ❌ Bad / edge | `biasBucketKey('Number', 0)`                    | `'zero'`     | `0` is neither positive nor negative — has its own bucket rather than being coerced into `'positive'` or dropped.  |

### `computeDateRangeAttributes(nonMissing: Cell[]): { isDateRangeComplete?: boolean; missingYears?: number[] }`

For Date cells, finds the min/max year present and reports which years within that range have no data at all.

| Case          | Input                                                        | Output                                                 | Notes                                                                                                                                |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| ✅ Good       | Dates in 2020, 2020, 2022                                    | `{ isDateRangeComplete: false, missingYears: [2021] }` | 2021 has no rows, so it's flagged as a gap.                                                                                          |
| ✅ Good       | Dates in 2021, 2022 (consecutive)                            | `{ isDateRangeComplete: true, missingYears: [] }`      | No gaps in the range.                                                                                                                |
| ❌ Bad / edge | `computeDateRangeAttributes([{value:1,data_type:'Number'}])` | `{}`                                                   | No Date-typed cells present — returns an empty object (both fields `undefined`) instead of a false "complete" or "incomplete" claim. |
| ❌ Bad / edge | A single date value (min year === max year)                  | `{ isDateRangeComplete: true, missingYears: [] }`      | A one-point range trivially has no gaps — not mistaken for "insufficient data".                                                      |

### `computeNumericRangeAttributes(nonMissing: Cell[]): { min_value?: number; max_value?: number; average_value?: number }`

For Number columns, computes the minimum, maximum, and arithmetic mean of the non-missing numeric values.

| Case          | Input                                                                          | Output                                             | Notes                                                                            |
| ------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| ✅ Good       | `computeNumericRangeAttributes([{value:2,...}, {value:4,...}, {value:6,...}])` | `{ min_value: 2, max_value: 6, average_value: 4 }` | Standard case.                                                                   |
| ✅ Good       | `computeNumericRangeAttributes([{value:5,...}])`                               | `{ min_value: 5, max_value: 5, average_value: 5 }` | Single value — trivial range.                                                    |
| ❌ Bad / edge | `computeNumericRangeAttributes([])`                                            | `{}`                                               | No numeric cells present — returns an empty object rather than `NaN`/`Infinity`. |

### `computeTopValues(nonMissing: Cell[], topN = 3): TopValueEntry[]`

For String/Date/Time/DateTime columns, groups non-missing cells by distinct value, counts occurrences, and returns the `topN` most frequent, sorted by count descending with ties broken by first-seen order (consistent with `mostCommonDataType`'s tie-break philosophy). If every value in the column is distinct (no repeats at all), returns **all** distinct values instead of truncating to `topN`.

| Case          | Input                                       | Output                                                          | Notes                                                      |
| ------------- | ------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| ✅ Good       | `['a','a','a','b','b','c','d']`             | `[{value:'a',count:3},{value:'b',count:2},{value:'c',count:1}]` | Top 3 by frequency; `'d'` dropped.                         |
| ✅ Good       | `['a','b','c','d','e']` (all unique)        | 5 entries, each `count: 1`                                      | No repeats anywhere — full list returned instead of top 3. |
| ✅ Good       | `['b','a','b','a']` (tie)                   | `[{value:'b',count:2},{value:'a',count:2}]`                     | Equal counts (2 vs 2) — resolved by first-seen order.      |
| ❌ Bad / edge | `[]` (all cells missing, filtered upstream) | `[]`                                                            | No non-missing cells — empty result rather than throwing.  |
