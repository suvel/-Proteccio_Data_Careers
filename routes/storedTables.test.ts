import request from 'supertest';
import app from '../server';
import { clearTables } from '../store/tablesStore';
import { MAX_ROW_SHEET_UPLOAD, MAX_ROW_CAN_INSERT } from '../utility_function/constants/config';

const sampleTableObject = {
  headers: [{ header_id: 'name', header_label: 'Name', isDuplicateName: false }],
  rows: [{ name: { value: 'Alice', data_type: 'String' } }],
  colAttributes: [],
};

beforeEach(async () => {
  await clearTables();
});

describe('POST /table', () => {
  it('stores a table and returns it with a generated id', async () => {
    const res = await request(app)
      .post('/table')
      .send({ title: 'Q1 export', tableObject: sampleTableObject });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Q1 export');
    expect(res.body.tableObject).toEqual(sampleTableObject);
    expect(typeof res.body.id).toBe('number');
  });

  it('returns 400 BAD_REQUEST when title is missing', async () => {
    const res = await request(app).post('/table').send({ tableObject: sampleTableObject });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 BAD_REQUEST when tableObject is missing or malformed', async () => {
    const res = await request(app).post('/table').send({ title: 'Q1 export' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns 400 SHEET_ROW_LIMIT_EXCEEDED when the table has more than MAX_ROW_SHEET_UPLOAD rows', async () => {
    const bigTableObject = {
      ...sampleTableObject,
      rows: Array.from({ length: MAX_ROW_SHEET_UPLOAD + 1 }, () => sampleTableObject.rows[0]),
    };
    const res = await request(app)
      .post('/table')
      .send({ title: 'Too big', tableObject: bigTableObject });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SHEET_ROW_LIMIT_EXCEEDED');
  });

  it('returns 400 INSERT_ROW_LIMIT_EXCEEDED once MAX_ROW_CAN_INSERT tables are already stored', async () => {
    for (let i = 0; i < MAX_ROW_CAN_INSERT; i++) {
      await request(app)
        .post('/table')
        .send({ title: `T${i}`, tableObject: sampleTableObject });
    }
    const res = await request(app)
      .post('/table')
      .send({ title: 'One too many', tableObject: sampleTableObject });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INSERT_ROW_LIMIT_EXCEEDED');
  });
});

describe('GET /table', () => {
  it('returns an empty array when nothing is stored', async () => {
    const res = await request(app).get('/table');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all stored tables', async () => {
    await request(app).post('/table').send({ title: 'A', tableObject: sampleTableObject });
    await request(app).post('/table').send({ title: 'B', tableObject: sampleTableObject });

    const res = await request(app).get('/table');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('DELETE /table/:id', () => {
  it('deletes an existing table and returns 204', async () => {
    const stored = await request(app)
      .post('/table')
      .send({ title: 'Q1 export', tableObject: sampleTableObject });

    const res = await request(app).delete(`/table/${stored.body.id}`);
    expect(res.status).toBe(204);

    const list = await request(app).get('/table');
    expect(list.body).toEqual([]);
  });
});
