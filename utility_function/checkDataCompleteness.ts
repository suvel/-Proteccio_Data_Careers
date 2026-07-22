import { ColumnAttributes, Header, ParsedFile, Row } from './types';
import {
  computeBiasAttributes,
  computeDateRangeAttributes,
  computeNumericRangeAttributes,
  computeStandardDeviationForCells,
  computeTopValues,
  getNonMissingCells,
  mostCommonDataType,
  validateParsedFile,
} from './helpers';

/**
 * Computes standard deviation, bias, and date-range completeness for one column.
 * @example
 * computeColumnAttributes(
 *   { header_id: 'age', header_label: 'Age', isDuplicateName: false },
 *   [{ age: { value: 2, data_type: 'Number' } }, { age: { value: 4, data_type: 'Number' } }],
 * )
 * // => { header_id: 'age', data_type: 'Number', isBiased: false, standard_deviation: 1 }
 */
function computeColumnAttributes(header: Header, rows: Row[]): ColumnAttributes {
  const { cells, nonMissing } = getNonMissingCells(header, rows);
  const dataType = mostCommonDataType(nonMissing.length > 0 ? nonMissing : cells);

  const attrs: ColumnAttributes = {
    header_id: header.header_id,
    data_type: dataType,
    isBiased: false,
  };
  if (nonMissing.length === 0) return attrs;

  if (dataType === 'Number') {
    attrs.standard_deviation = computeStandardDeviationForCells(nonMissing);
    Object.assign(attrs, computeNumericRangeAttributes(nonMissing));
  }

  Object.assign(attrs, computeBiasAttributes(dataType, nonMissing));

  if (dataType === 'Date' || dataType === 'DateTime') {
    Object.assign(attrs, computeDateRangeAttributes(nonMissing));
  }

  if (
    dataType === 'String' ||
    dataType === 'Date' ||
    dataType === 'Time' ||
    dataType === 'DateTime'
  ) {
    attrs.topValues = computeTopValues(nonMissing);
  }

  return attrs;
}

/**
 * Computes completeness/bias attributes for every column in a parsed file.
 * @example
 * checkDataCompleteness({
 *   headers: [{ header_id: 'age', header_label: 'Age', isDuplicateName: false }],
 *   rows: [{ age: { value: 2, data_type: 'Number' } }, { age: { value: 4, data_type: 'Number' } }],
 *   colAttributes: [],
 * })
 * // => [{ header_id: 'age', data_type: 'Number', isBiased: false, standard_deviation: 1 }]
 */
export function checkDataCompleteness(parsedFile: ParsedFile): ColumnAttributes[] {
  validateParsedFile(parsedFile);
  return parsedFile.headers.map((header) => computeColumnAttributes(header, parsedFile.rows));
}
