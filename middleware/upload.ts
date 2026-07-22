import * as os from 'os';
import * as path from 'path';
import multer from 'multer';
import { PublicApiError } from '../utility_function/errors';
import { RestErrorCode } from '../utility_function/constants/errorCodes';
import { SUPPORTED_EXTENSIONS } from '../utility_function/constants/config';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `process_document_${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      cb(new PublicApiError(RestErrorCode.BAD_REQUEST));
      return;
    }
    cb(null, true);
  },
});
