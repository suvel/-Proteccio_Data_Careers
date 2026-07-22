export type DataType = 'String' | 'Number' | 'Date';

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
  missing_data?: boolean;
}

export interface Row {
  [header_id: string]: Cell;
}

export interface ColumnAttributes {
  header_id: string;
  data_type: DataType;
  standard_deviation?: number;
  isBiased: boolean;
  biasedValue?: string;
  isDateRangeComplete?: boolean;
  missingYears?: number[];
}

export interface ParsedFile {
  headers: Header[];
  rows: Row[];
  colAttributes: ColumnAttributes[];
}
