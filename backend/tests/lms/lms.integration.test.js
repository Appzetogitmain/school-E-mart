const request = require('supertest');
const { createApp } = require('../../src/app');

describe('lms routes', () => {
  const app = createApp();

  test('GET /api/v1/schools/:schoolId/lms/courses requires authentication', async () => {
    const schoolId = '507f1f77bcf86cd799439011';
    const response = await request(app).get(`/api/v1/schools/${schoolId}/lms/courses`);
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/v1/schools/:schoolId/lms/bookmarks/resume requires authentication', async () => {
    const schoolId = '507f1f77bcf86cd799439011';
    const response = await request(app).get(`/api/v1/schools/${schoolId}/lms/bookmarks/resume`);
    expect(response.status).toBe(401);
  });
});
