import type { ParsedFile } from '../types';

export interface SensitiveColumnInfo {
  headerId: string;
  matchedPatterns: string[];
}

export function getSensitiveColumnInfo(result: ParsedFile): SensitiveColumnInfo[] {
  const matchedPatternsByColumn = new Map<string, Set<string>>();
  for (const row of result.rows) {
    for (const [headerId, cell] of Object.entries(row)) {
      if (cell?.sensitive_data) {
        const patterns = matchedPatternsByColumn.get(headerId) ?? new Set<string>();
        if (cell.sensitive_pattern) patterns.add(cell.sensitive_pattern);
        matchedPatternsByColumn.set(headerId, patterns);
      }
    }
  }
  return result.headers
    .filter((h) => matchedPatternsByColumn.has(h.header_id))
    .map((h) => ({
      headerId: h.header_id,
      matchedPatterns: Array.from(matchedPatternsByColumn.get(h.header_id) ?? []),
    }));
}

export function getSensitiveColumnIds(result: ParsedFile): string[] {
  return getSensitiveColumnInfo(result).map((info) => info.headerId);
}
