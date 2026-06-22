const request = require('supertest');
const { createApp } = require('../../src/app');

describe('marketplace routes', () => {
  const app = createApp();

  test('GET /api/v1/catalog/products is public', async () => {
    const response = await request(app).get('/api/v1/catalog/products');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('GET /api/v1/catalog/cart requires authentication', async () => {
    const response = await request(app).get('/api/v1/catalog/cart');
    expect(response.status).toBe(401);
  });

  test('POST /api/v1/catalog/header-categories requires admin auth', async () => {
    const response = await request(app).post('/api/v1/catalog/header-categories').send({
      name: 'Test Header',
    });
    expect(response.status).toBe(401);
  });
});
