import { ErrorRequestHandler } from 'express';
import { PublicApiError, toPublicApiError } from '../utility_function/errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // toPublicApiError only translates ValidationError; an error that's already
  // a PublicApiError (e.g. raised directly by a route) must pass through as-is.
  const publicError = err instanceof PublicApiError ? err : toPublicApiError(err);
  res.status(publicError.httpStatus).json({
    code: publicError.code,
    message: publicError.message,
  });
};
