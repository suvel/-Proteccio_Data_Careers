import request from 'supertest';
import app from '../server';
import { clearTables } from '../store/tablesStore';

const sampleTableObject = {
  headers: [{ header_id: 'name', header_label: 'Name', isDuplicateName: false }],
  rows: [{ name: { value: 'Alice', data_type: 'String' } }],
  colAttributes: [],
};

beforeEach(() => {
  clearTables();
});

describe('POST /table', () => {
  it('stores a table and returns it with a generated id', async () => {
    const res = await request(app)
      .post('/table')
      .send({ title: 'Q1 export', tableObject: sampleTableObject });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Q1 export');
    expect(res.body.tableObject).toEqual(sampleTableObject);
    expect(typeof res.body.id).toBe('string');
    expect(res.body.id.length).toBeGreaterThan(0);
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

  it('returns 404 NOT_FOUND for an unknown id', async () => {
    const res = await request(app).delete('/table/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
