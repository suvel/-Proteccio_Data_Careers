export type DataType = 'String' | 'Number' | 'Date' | 'Time' | 'DateTime';

export interface Header {
  header_id: string;
  header_label: string;
  isDuplicateName: boolean;
  old_label?: string;
}

export interface Cell {
  value: string | number | Date | null;
  data_type: DataType;
  sensitive_data?: boolean;
  sensitive_pattern?: string;
  missing_data?: boolean;
}

export interface Row {
  [header_id: string]: Cell;
}

export interface TopValueEntry {
  value: string | number | Date | null;
  count: number;
}

export interface ColumnAttributes {
  header_id: string;
  data_type: DataType;
  standard_deviation?: number;
  isBiased: boolean;
  biasedValue?: string;
  isDateRangeComplete?: boolean;
  missingYears?: number[];
  min_value?: number;
  max_value?: number;
  average_value?: number;
  topValues?: TopValueEntry[];
}

export interface ParsedFile {
  headers: Header[];
  rows: Row[];
  colAttributes: ColumnAttributes[];
  duplicateRows?: Record<string, number[]>;
}
