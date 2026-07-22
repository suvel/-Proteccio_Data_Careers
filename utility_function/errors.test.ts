import { PublicApiError, ValidationError, toPublicApiError } from './errors';
import { RestErrorCode, ValidationErrorCode } from './constants/errorCodes';

describe('toPublicApiError', () => {
  it.each([
    ValidationErrorCode.INVALID_PARSED_FILE,
    ValidationErrorCode.INVALID_HEADERS,
    ValidationErrorCode.INVALID_ROWS,
    ValidationErrorCode.MISSING_ROW_CELL,
  ])('collapses ValidationError(%s) into a generic BAD_REQUEST PublicApiError', (code) => {
    const publicError = toPublicApiError(new ValidationError(code));

    expect(publicError).toBeInstanceOf(PublicApiError);
    expect(publicError.code).toBe(RestErrorCode.BAD_REQUEST);
    expect(publicError.httpStatus).toBe(400);
    expect(publicError.message).not.toBe(new ValidationError(code).message);
  });

  it('maps an unexpected error to a generic INTERNAL_SERVER_ERROR PublicApiError', () => {
    const publicError = toPublicApiError(new Error('something broke'));

    expect(publicError).toBeInstanceOf(PublicApiError);
    expect(publicError.code).toBe(RestErrorCode.INTERNAL_SERVER_ERROR);
    expect(publicError.httpStatus).toBe(500);
  });

  it('maps a non-Error thrown value to a generic INTERNAL_SERVER_ERROR PublicApiError', () => {
    const publicError = toPublicApiError('a raw string was thrown');

    expect(publicError.code).toBe(RestErrorCode.INTERNAL_SERVER_ERROR);
    expect(publicError.httpStatus).toBe(500);
  });
});
