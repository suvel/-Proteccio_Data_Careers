import { RequestHandler } from 'express';
import { addTable, deleteTable, listTables } from '../store/tablesStore';
import { validateParsedFile } from '../utility_function/helpers';
import { PublicApiError, toPublicApiError } from '../utility_function/errors';
import { RestErrorCode } from '../utility_function/constants/errorCodes';

export const storeTable: RequestHandler = (req, res, next) => {
  const { title, tableObject } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    next(new PublicApiError(RestErrorCode.BAD_REQUEST));
    return;
  }

  try {
    validateParsedFile(tableObject);
  } catch (err) {
    next(toPublicApiError(err));
    return;
  }

  const table = addTable(title, tableObject);
  res.status(201).json(table);
};

export const listStoredTables: RequestHandler = (_req, res) => {
  res.json(listTables());
};

export const deleteStoredTable: RequestHandler = (req, res, next) => {
  const { id } = req.params;
  const deleted = deleteTable(id);
  if (!deleted) {
    next(new PublicApiError(RestErrorCode.NOT_FOUND));
    return;
  }
  res.status(204).send();
};
