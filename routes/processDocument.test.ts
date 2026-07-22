import * as path from 'path';
import request from 'supertest';
import app from '../server';

const utilityFixture = (name: string) =>
  path.join(__dirname, '../utility_function/__fixtures__', name);
const routeFixture = (name: string) => path.join(__dirname, '__fixtures__', name);

describe('POST /process_document', () => {
  describe('success cases', () => {
    it('parses, checks quality, and cleans up a well-formed CSV', async () => {
      const res = await request(app)
        .post('/process_document')
        .attach('file', utilityFixture('mixed-types.csv'));

      expect(res.status).toBe(200);
      expect(res.body.headers).toEqual([
        { header_id: 'name', header_label: 'Name', isDuplicateName: false },
        { header_id: 'age', header_label: 'Age', isDuplicateName: false },
        { header_id: 'signup_date', header_label: 'Signup Date', isDuplicateName: false },
      ]);
      expect(res.body.rows).toHaveLength(3);
      expect(res.body.rows[0].name).toEqual({ value: 'Alice', data_type: 'String' });
      expect(res.body.rows[2].age).toEqual({
        value: null,
        data_type: 'String',
        missing_data: true,
      });
      expect(res.body.colAttributes).toHaveLength(3);
      expect(res.body.duplicateRows).toEqual({});
    });

    it('groups duplicate rows by fingerprint and excludes unique rows', async () => {
      const res = await request(app)
        .post('/process_document')
        .attach('file', utilityFixture('duplicate-rows.csv'));

      expect(res.status).toBe(200);
      const groups = Object.values(res.body.duplicateRows) as number[][];
      expect(groups).toHaveLength(1);
      expect(groups[0]).toEqual([0, 2]);
    });

    it('flags sensitive and missing data on the returned cells', async () => {
      const res = await request(app)
        .post('/process_document')
        .attach('file', utilityFixture('sensitive-data.csv'));

      expect(res.status).toBe(200);
      const [johnRow, janeRow] = res.body.rows;

      expect(johnRow.full_name).toEqual({
        value: 'John Smith',
        data_type: 'String',
        sensitive_data: true,
        sensitive_pattern: 'Full Name',
      });
      expect(johnRow.email).toEqual({
        value: 'john.smith@example.com',
        data_type: 'String',
        sensitive_data: true,
        sensitive_pattern: 'Email',
      });
      expect(johnRow.phone).toEqual({
        value: '+919812345678',
        data_type: 'String',
        sensitive_data: true,
        sensitive_pattern: 'Phone Number',
      });
      expect(johnRow.notes).toEqual({ value: '-', data_type: 'String', missing_data: true });

      expect(janeRow.full_name).toEqual({
        value: 'Jane Doe',
        data_type: 'String',
        sensitive_data: true,
        sensitive_pattern: 'Full Name',
      });
      expect(janeRow.email.sensitive_data).toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('returns 400 BAD_REQUEST when no file is attached', async () => {
      const res = await request(app).post('/process_document');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        code: 'BAD_REQUEST',
        message: 'The request could not be understood or was missing required parameters.',
      });
    });

    it('returns 400 BAD_REQUEST for an unsupported file extension', async () => {
      const res = await request(app)
        .post('/process_document')
        .attach('file', routeFixture('not-a-real-file.txt'));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('BAD_REQUEST');
    });

    it('rejects a file attached under a field name multer was not configured for', async () => {
      // multer itself throws (unexpected field) before the route handler runs, so this
      // error bypasses PublicApiError and is collapsed by toPublicApiError into a generic 500.
      const res = await request(app)
        .post('/process_document')
        .attach('document', utilityFixture('mixed-types.csv'));

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });
});
