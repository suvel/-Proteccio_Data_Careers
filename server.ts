import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { upload } from './middleware/upload';
import { processDocument } from './routes/processDocument';
import { PublicApiError } from './utility_function/errors';
import { RestErrorCode } from './utility_function/constants/errorCodes';

const app = express();

app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello, world!' });
});

app.post('/process_document', upload.single('file'), processDocument);

app.use((_req, _res, next) => {
  next(new PublicApiError(RestErrorCode.NOT_FOUND));
});

app.use(errorHandler);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
