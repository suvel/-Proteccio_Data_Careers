import { RequestHandler } from 'express';
import { addTable, deleteTable, listTables } from '../store/tablesStore';
import { validateParsedFile } from '../utility_function/helpers';
import { PublicApiError, toPublicApiError } from '../utility_function/errors';
import { RestErrorCode } from '../utility_function/constants/errorCodes';
import { MAX_ROW_SHEET_UPLOAD, MAX_ROW_CAN_INSERT } from '../utility_function/constants/config';

export const storeTable: RequestHandler = async (req, res, next) => {
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

  if (tableObject.rows.length > MAX_ROW_SHEET_UPLOAD) {
    next(new PublicApiError(RestErrorCode.SHEET_ROW_LIMIT_EXCEEDED));
    return;
  }

  try {
    const existingTables = await listTables();
    const existingTotal = existingTables.length;
    if (existingTotal + 1 > MAX_ROW_CAN_INSERT) {
      next(new PublicApiError(RestErrorCode.INSERT_ROW_LIMIT_EXCEEDED));
      return;
    }
  } catch (err) {
    next(toPublicApiError(err));
    return;
  }

  try {
    const table = await addTable(title, tableObject);
    res.status(201).json(table);
  } catch (err) {
    next(toPublicApiError(err));
  }
};

export const listStoredTables: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await listTables());
  } catch (err) {
    console.log(JSON.stringify(err, null, 2));
    next(toPublicApiError(err));
  }
};

export const deleteStoredTable: RequestHandler = async (req, res, next) => {
  const { id } = req.params;
  try {
    const deleted = await deleteTable(id);
    if (!deleted) {
      next(new PublicApiError(RestErrorCode.NOT_FOUND));
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(toPublicApiError(err));
  }
};
