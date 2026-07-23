import express from 'express';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { upload } from './middleware/upload';
import { processDocument } from './routes/processDocument';
import { storeTable, listStoredTables, deleteStoredTable } from './routes/storedTables';
import { PublicApiError } from './utility_function/errors';
import { RestErrorCode } from './utility_function/constants/errorCodes';

const app = express();

app.use(express.json({ limit: '10mb' }));

app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello, world!' });
});

app.post('/process_document', upload.single('file'), processDocument);

app.post('/table', storeTable);
app.get('/table', listStoredTables);
app.delete('/table/:id', deleteStoredTable);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

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
