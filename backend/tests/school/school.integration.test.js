const request = require('supertest');
const { createApp } = require('../../src/app');

describe('school routes', () => {
  const app = createApp();

  test('GET /api/v1/schools requires authentication', async () => {
    const response = await request(app).get('/api/v1/schools');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/v1/schools/:schoolId/students requires authentication', async () => {
    const schoolId = '507f1f77bcf86cd799439011';
    const response = await request(app).get(`/api/v1/schools/${schoolId}/students`);
    expect(response.status).toBe(401);
  });
});
