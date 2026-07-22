/**
 * Internal validation codes thrown by checkDataCompleteness.ts, checkDataQuality.ts,
 * and determineDataCleanup.ts. These carry implementation detail meant for server-side
 * logging only — never serialize them directly to an API caller.
 */
export enum ValidationErrorCode {
  INVALID_PARSED_FILE = 'INVALID_PARSED_FILE',
  INVALID_HEADERS = 'INVALID_HEADERS',
  INVALID_ROWS = 'INVALID_ROWS',
  MISSING_ROW_CELL = 'MISSING_ROW_CELL',
}

export const VALIDATION_ERROR_MESSAGES: Record<ValidationErrorCode, string> = {
  [ValidationErrorCode.INVALID_PARSED_FILE]:
    'Expected a ParsedFile object but received null, undefined, or a non-object value.',
  [ValidationErrorCode.INVALID_HEADERS]: 'ParsedFile.headers is missing or is not an array.',
  [ValidationErrorCode.INVALID_ROWS]: 'ParsedFile.rows is missing or is not an array.',
  [ValidationErrorCode.MISSING_ROW_CELL]:
    'A row is missing a cell for one of the declared headers.',
};

/**
 * Generic REST API error catalogue, safe to serialize directly in a response to any caller.
 */
export enum RestErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export const REST_ERROR_MAP: Record<RestErrorCode, { message: string; httpStatus: number }> = {
  [RestErrorCode.BAD_REQUEST]: {
    message: 'The request could not be understood or was missing required parameters.',
    httpStatus: 400,
  },
  [RestErrorCode.UNAUTHORIZED]: {
    message: 'Authentication is required and has failed or has not been provided.',
    httpStatus: 401,
  },
  [RestErrorCode.FORBIDDEN]: {
    message:
      'The request was valid, but the caller does not have access to the requested resource.',
    httpStatus: 403,
  },
  [RestErrorCode.NOT_FOUND]: {
    message: 'The requested resource could not be found.',
    httpStatus: 404,
  },
  [RestErrorCode.METHOD_NOT_ALLOWED]: {
    message: 'The HTTP method used is not supported for the requested resource.',
    httpStatus: 405,
  },
  [RestErrorCode.CONFLICT]: {
    message:
      'The request could not be completed due to a conflict with the current state of the resource.',
    httpStatus: 409,
  },
  [RestErrorCode.UNPROCESSABLE_ENTITY]: {
    message: 'The request was well-formed but contains semantic errors.',
    httpStatus: 422,
  },
  [RestErrorCode.TOO_MANY_REQUESTS]: {
    message: 'The caller has sent too many requests in a given amount of time.',
    httpStatus: 429,
  },
  [RestErrorCode.INTERNAL_SERVER_ERROR]: {
    message: 'An unexpected error occurred while processing the request.',
    httpStatus: 500,
  },
  [RestErrorCode.SERVICE_UNAVAILABLE]: {
    message: 'The service is temporarily unable to handle the request.',
    httpStatus: 503,
  },
};
