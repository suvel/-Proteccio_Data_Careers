import * as fs from 'fs';
import { RequestHandler } from 'express';
import { parseFileToJson } from '../utility_function/parseFileToJson';
import { checkDataQuality } from '../utility_function/checkDataQuality';
import { determineDataCleanup } from '../utility_function/determineDataCleanup';
import { PublicApiError } from '../utility_function/errors';
import { RestErrorCode } from '../utility_function/constants/errorCodes';

export const processDocument: RequestHandler = (req, res, next) => {
  const file = req.file;
  if (!file) {
    next(new PublicApiError(RestErrorCode.BAD_REQUEST));
    return;
  }

  try {
    const parsedFile = parseFileToJson(file.path);
    const qualityChecked = checkDataQuality(parsedFile);
    const result = determineDataCleanup(qualityChecked);
    res.json(result);
  } catch (err) {
    next(err);
  } finally {
    fs.unlink(file.path, () => {});
  }
};
