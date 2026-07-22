import {
  REST_ERROR_MAP,
  RestErrorCode,
  VALIDATION_ERROR_MESSAGES,
  ValidationErrorCode,
} from './constants/errorCodes';

/**
 * Internal-only error thrown by the data-quality check functions. Carries implementation
 * detail for server-side logging; never send this straight to an API caller.
 */
export class ValidationError extends Error {
  code: ValidationErrorCode;

  constructor(code: ValidationErrorCode) {
    super(VALIDATION_ERROR_MESSAGES[code]);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * Generic, safe-to-serialize error a server response layer sends to an API caller.
 */
export class PublicApiError extends Error {
  code: RestErrorCode;
  httpStatus: number;

  constructor(code: RestErrorCode) {
    const { message, httpStatus } = REST_ERROR_MAP[code];
    super(message);
    this.name = 'PublicApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * Translation boundary a server/controller layer calls before responding to a caller,
 * so internal validation detail never leaks into a client-facing response.
 */
export function toPublicApiError(error: unknown): PublicApiError {
  if (error instanceof ValidationError) {
    return new PublicApiError(RestErrorCode.BAD_REQUEST);
  }
  return new PublicApiError(RestErrorCode.INTERNAL_SERVER_ERROR);
}
