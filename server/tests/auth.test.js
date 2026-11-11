const request = require('supertest');
const app = require('../src/index');

// Mock mongoose and models
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
    model: jest.fn(),
  };
});

jest.mock('../src/models/User', () => {
  const mockUser = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  return mockUser;
});

jest.mock('../src/models/Reading');

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
}));

const User = require('../src/models/User');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      User.findOne.mockResolvedValueOnce(null); // no existing user
      User.create.mockResolvedValueOnce({
        _id: 'abc123',
        name: 'Test',
        email: 'test@test.com',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@test.com');
    });

    it('should reject duplicate email', async () => {
      User.findOne.mockResolvedValueOnce({ _id: 'abc123', email: 'test@test.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/at least 6 characters/);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      const mockUserDoc = {
        _id: 'abc123',
        name: 'Test',
        email: 'test@test.com',
        password: 'hashedpassword',
        comparePassword: jest.fn().mockResolvedValue(true),
        select: jest.fn(),
      };
      // findOne().select('+password') chain
      User.findOne.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(mockUserDoc),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      User.findOne.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(null),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid/);
    });
  });
});
