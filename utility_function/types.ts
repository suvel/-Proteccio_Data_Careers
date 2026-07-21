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
}

export interface Row {
  [header_id: string]: Cell;
}

export interface ParsedFile {
  headers: Header[];
  rows: Row[];
}
