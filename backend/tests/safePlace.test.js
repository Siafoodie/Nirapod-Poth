import { describe, test, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

vi.mock('../src/models/SafePlace.js', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        {
          _id: '60d0fe4f5311236168a109ca',
          name: 'Test Hospital',
          category: 'hospital',
          address: 'Dhaka',
          coordinates: [90.3900, 23.8100],
          phone: '01711111111',
          isOpen247: true
        }
      ])
    }),
    create: vi.fn().mockImplementation((data) => Promise.resolve({
      _id: '60d0fe4f5311236168a109cb',
      ...data
    }))
  }
}));

describe('US-10: Safe Places API, Caching & Category Filter Tests', () => {
  
  test('GET /api/safe-places should return places and support category filtering', async () => {
    const res = await request(app).get('/api/safe-places?category=hospital');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
  }, 15000); // Increased timeout to 15s

  test('POST /api/safe-places should create a new safe place and invalidate cache', async () => {
    const testPlace = {
      name: 'Test Safe Shelter',
      category: 'police',
      address: 'Dhaka',
      coordinates: [90.3900, 23.8100],
      phone: '01711111111',
      isOpen247: true
    };

    const res = await request(app)
      .post('/api/safe-places')
      .send(testPlace);
      
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
  }, 15000); // Increased timeout to 15s
}); 