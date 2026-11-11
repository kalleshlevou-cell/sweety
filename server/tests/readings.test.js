const request = require('supertest');
const app = require('../src/index');

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
    model: jest.fn(),
  };
});

jest.mock('../src/models/User');

jest.mock('../src/models/Reading', () => {
  const mockReading = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  };
  return mockReading;
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ id: 'user123', email: 'test@test.com' }),
}));

const Reading = require('../src/models/Reading');

describe('Readings API', () => {
  const authHeader = { Authorization: 'Bearer mock-token' };
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/readings', () => {
    it('should create a reading', async () => {
      Reading.findOne.mockResolvedValueOnce(null); // no duplicate
      Reading.countDocuments.mockResolvedValueOnce(0); // day count
      Reading.create.mockResolvedValueOnce({
        _id: 'r1',
        user: 'user123',
        date: new Date(today),
        time_slot: 'morning_fasting',
        value: 120,
      });

      const res = await request(app)
        .post('/api/readings')
        .set(authHeader)
        .send({ date: today, time_slot: 'morning_fasting', value: 120 });

      expect(res.status).toBe(201);
      expect(res.body.reading.value).toBe(120);
    });

    it('should reject missing value', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set(authHeader)
        .send({ date: today, time_slot: 'morning_fasting' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/glucose value/);
    });

    it('should reject value out of range', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set(authHeader)
        .send({ date: today, time_slot: 'morning_fasting', value: 700 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/between 40 and 600/);
    });

    it('should reject future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/readings')
        .set(authHeader)
        .send({ date: futureDateStr, time_slot: 'morning_fasting', value: 120 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/future/);
    });

    it('should reject duplicate slot for same day', async () => {
      Reading.findOne.mockResolvedValueOnce({ _id: 'r1' }); // duplicate exists

      const res = await request(app)
        .post('/api/readings')
        .set(authHeader)
        .send({ date: today, time_slot: 'morning_fasting', value: 120 });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already have/);
    });

    it('should reject 5th reading in a day', async () => {
      Reading.findOne.mockResolvedValueOnce(null); // no duplicate slot
      Reading.countDocuments.mockResolvedValueOnce(4); // already 4

      const res = await request(app)
        .post('/api/readings')
        .set(authHeader)
        .send({ date: today, time_slot: 'morning_fasting', value: 120 });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/only 4 readings/);
    });
  });

  describe('GET /api/readings', () => {
    it('should return paginated readings', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([
          { _id: 'r1', date: new Date(today), time_slot: 'morning_fasting', value: 120 },
        ]),
      };
      Reading.find.mockReturnValueOnce(mockQuery);
      Reading.countDocuments.mockResolvedValueOnce(1);

      const res = await request(app)
        .get('/api/readings')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('readings');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('DELETE /api/readings/:id', () => {
    it('should delete a reading', async () => {
      Reading.findOneAndDelete.mockResolvedValueOnce({ _id: 'r1' });

      const res = await request(app)
        .delete('/api/readings/r1')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/);
    });

    it('should return 404 for non-existent reading', async () => {
      Reading.findOneAndDelete.mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/api/readings/nonexistent')
        .set(authHeader);

      expect(res.status).toBe(404);
    });
  });
});
