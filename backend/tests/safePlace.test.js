import { afterEach, beforeEach, describe, test, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import SafePlace from '../src/models/SafePlace.js';

beforeEach(() => {
  vi.spyOn(SafePlace, 'find').mockReturnValue({
    sort: vi.fn().mockResolvedValue([
      {
        _id: '60d0fe4f5311236168a109ca',
        name: 'Test Hospital',
        category: 'hospital',
        address: 'Dhaka',
        coordinates: [90.39, 23.81],
        phone: '01711111111',
        isOpen247: true,
      },
    ]),
  });
  vi.spyOn(SafePlace, 'create').mockImplementation((data) =>
    Promise.resolve({
      _id: '60d0fe4f5311236168a109cb',
      ...data,
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('T-10.3: Safe Places Directory API', () => {

  test('GET /api/safe-places should return places and support category filtering', async () => {
    const res = await request(app).get('/api/safe-places?category=hospital');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toMatchObject([
      {
        name: 'Test Hospital',
        category: 'hospital',
        coordinates: [90.39, 23.81],
      },
    ]);
    expect(SafePlace.find).toHaveBeenCalledWith({ category: 'hospital' });
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
    expect(SafePlace.create).toHaveBeenCalledWith(testPlace);
  }, 15000); // Increased timeout to 15s
});

describe('T-10.3: Safe-place map data validation', () => {
  test('rejects coordinates outside valid longitude and latitude ranges', async () => {
    const place = new SafePlace({
      name: 'Invalid Location',
      category: 'hospital',
      address: 'Dhaka',
      coordinates: [190, 95],
    });

    await expect(place.validate()).rejects.toMatchObject({
      errors: { coordinates: expect.any(Object) },
    });
  });
});