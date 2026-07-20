// jest.setup mocks uuid.v4 to a constant, which makes every auth session share a
// jti and collide. These tests mint several sessions, so use real uuids here.
jest.mock('uuid', () => ({ v4: () => require('crypto').randomUUID() }));

// Nothing here should reach a real SMTP server. Mocking at the module boundary
// also lets the tests assert that the right mail was queued.
jest.mock('../../src/common/email', () => ({
  sendSchoolRegistrationPendingEmail: jest.fn().mockResolvedValue({ success: true }),
  sendSchoolWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendSchoolApprovedEmail: jest.fn().mockResolvedValue({ success: true }),
  sendMail: jest.fn().mockResolvedValue({ success: true }),
}));

const request = require('supertest');
const { createApp } = require('../../src/app');
const { createAdminUser, authHeaderFor } = require('../vendor/helpers');
const emailService = require('../../src/common/email');
const School = require('../../src/database/models/School');
const User = require('../../src/database/models/User');
const SchoolStaffProfile = require('../../src/database/models/SchoolStaffProfile');

const NEW_SCHOOL = {
  schoolName: 'Admin Made School',
  fullName: 'Admin Made Principal',
  email: 'admin.made.school@test.com',
  mobile: '9876500055',
  password: 'School@123',
  address: {
    line1: '1 Campus Road',
    city: 'Indore',
    state: 'MP',
    pinCode: '452001',
  },
  academicYearCurrent: '2024-25',
  gradesOffered: ['1', '2', '3'],
};

const registerSchool = (app, overrides = {}) =>
  request(app)
    .post('/api/v1/auth/school/admin/register')
    .send({
      schoolName: 'Self Registered School',
      fullName: 'Self Registered Admin',
      email: `self${Date.now()}@test.com`,
      mobile: `9${String(Date.now()).slice(-9)}`,
      password: 'School@123',
      ...overrides,
    });

describe('admin school management', () => {
  const app = createApp();
  let adminUser;

  const asAdmin = () => authHeaderFor(adminUser);

  beforeEach(async () => {
    adminUser = await createAdminUser();
    jest.clearAllMocks();
  });

  describe('POST /admin/schools', () => {
    test('creates a school that is active immediately', async () => {
      const res = await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send(NEW_SCHOOL);

      expect(res.status).toBe(201);
      expect(res.body.data.school.status).toBe('active');
      expect(res.body.data.school.partnerStatus).toBe('active');

      const school = await School.findOne({ name: NEW_SCHOOL.schoolName }).lean();
      expect(school.address.city).toBe('Indore');
      expect(school.academicYearCurrent).toBe('2024-25');
      expect(school.gradesOffered).toEqual(['1', '2', '3']);
    });

    test('creates the admin user and staff profile alongside the school', async () => {
      await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send(NEW_SCHOOL)
        .expect(201);

      const user = await User.findOne({ email: NEW_SCHOOL.email }).lean();
      expect(user).toBeTruthy();
      expect(user.role).toBe('school');
      expect(user.status).toBe('active');

      const staff = await SchoolStaffProfile.findOne({ userId: user._id }).lean();
      expect(staff).toBeTruthy();
      expect(String(staff.schoolId)).toBe(String(user.tenantSchoolId));
    });

    test('emails the school admin their credentials', async () => {
      await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send(NEW_SCHOOL)
        .expect(201);

      expect(emailService.sendSchoolWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendSchoolWelcomeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: NEW_SCHOOL.email,
          password: NEW_SCHOOL.password,
          schoolName: NEW_SCHOOL.schoolName,
        })
      );
    });

    test('rejects a duplicate email', async () => {
      await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send(NEW_SCHOOL)
        .expect(201);

      const res = await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send({ ...NEW_SCHOOL, mobile: '9876500066' });

      expect(res.status).toBe(409);
      expect(await School.countDocuments({ name: NEW_SCHOOL.schoolName })).toBe(1);
    });

    test('rejects a weak password rather than storing it', async () => {
      const res = await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send({ ...NEW_SCHOOL, password: 'weak' });

      expect(res.status).toBe(400);
      expect(await User.countDocuments({ email: NEW_SCHOOL.email })).toBe(0);
    });

    test('rejects a malformed academic year', async () => {
      const res = await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send({ ...NEW_SCHOOL, academicYearCurrent: 'last year' });

      expect(res.status).toBe(400);
    });

    test('requires admin authentication', async () => {
      const res = await request(app).post('/api/v1/admin/schools').send(NEW_SCHOOL);
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('self-registration', () => {
    test('creates the school as a prospect and does NOT issue a session', async () => {
      const res = await registerSchool(app);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending_approval');
      // Handing out tokens here would grant access the next login refuses.
      expect(res.body.data.accessToken).toBeUndefined();
      expect(res.body.data.tokens).toBeUndefined();

      const school = await School.findOne({ name: 'Self Registered School' }).lean();
      expect(school.partnerStatus).toBe('prospect');
    });

    test('emails a pending-approval notice, not credentials', async () => {
      await registerSchool(app).expect(200);

      expect(emailService.sendSchoolRegistrationPendingEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendSchoolWelcomeEmail).not.toHaveBeenCalled();
    });

    test('persists an address supplied at signup', async () => {
      await registerSchool(app, { address: { city: 'Bhopal', state: 'MP' } }).expect(200);

      const school = await School.findOne({ name: 'Self Registered School' }).lean();
      expect(school.address.city).toBe('Bhopal');
    });

    test('a failing mail server does not fail the registration', async () => {
      emailService.sendSchoolRegistrationPendingEmail.mockRejectedValueOnce(
        new Error('SMTP unreachable')
      );

      await registerSchool(app).expect(200);
      expect(await School.countDocuments({ name: 'Self Registered School' })).toBe(1);
    });
  });

  describe('login gate', () => {
    const login = (email) =>
      request(app)
        .post('/api/v1/auth/school/admin/login')
        .send({ email, password: 'School@123' });

    test('a pending school admin cannot log in', async () => {
      const email = `pending${Date.now()}@test.com`;
      await registerSchool(app, { email }).expect(200);

      const res = await login(email);
      expect(res.status).toBe(403);
      expect(res.body.error?.code || res.body.code).toBe('SCHOOL_PENDING');
    });

    test('an approved school admin can log in', async () => {
      const email = `approved${Date.now()}@test.com`;
      await registerSchool(app, { email }).expect(200);

      const school = await School.findOne({ name: 'Self Registered School' }).lean();
      await request(app)
        .post(`/api/v1/admin/schools/${school._id}/approve`)
        .set('Authorization', await asAdmin())
        .send({})
        .expect(200);

      const res = await login(email);
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken || res.body.data.tokens?.accessToken).toBeTruthy();
    });

    test('a rejected school admin is told the registration was rejected, not that the account is inactive', async () => {
      const email = `rejected${Date.now()}@test.com`;
      await registerSchool(app, { email }).expect(200);

      const school = await School.findOne({ name: 'Self Registered School' }).lean();
      await request(app)
        .post(`/api/v1/admin/schools/${school._id}/reject`)
        .set('Authorization', await asAdmin())
        .send({ reason: 'incomplete' })
        .expect(200);

      const res = await login(email);
      expect(res.status).toBe(403);
      // The generic 'inactive' check used to win this race and swallow the reason.
      expect(res.body.error?.code || res.body.code).toBe('SCHOOL_REJECTED');
    });

    test('an admin-created school admin can log in straight away', async () => {
      await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send(NEW_SCHOOL)
        .expect(201);

      const res = await login(NEW_SCHOOL.email);
      expect(res.status).toBe(200);
    });
  });

  describe('rejected vs pending', () => {
    const seedOne = async (overrides) => {
      const email = `s${Math.random().toString(36).slice(2)}@test.com`;
      await registerSchool(app, { email, ...overrides }).expect(200);
      return School.findOne({ adminEmail: email }).lean();
    };

    test('a rejected school reports status "rejected", not "pending"', async () => {
      const school = await seedOne();
      await request(app)
        .post(`/api/v1/admin/schools/${school._id}/reject`)
        .set('Authorization', await asAdmin())
        .send({ reason: 'incomplete' })
        .expect(200);

      const res = await request(app)
        .get(`/api/v1/admin/schools/${school._id}`)
        .set('Authorization', await asAdmin())
        .expect(200);

      // Reject stores partnerStatus 'prospect', identical to a new registration.
      expect(res.body.data.school.partnerStatus).toBe('prospect');
      expect(res.body.data.school.status).toBe('rejected');
    });

    test('a rejected school is excluded from the pending list', async () => {
      const pending = await seedOne();
      const rejected = await seedOne();

      await request(app)
        .post(`/api/v1/admin/schools/${rejected._id}/reject`)
        .set('Authorization', await asAdmin())
        .send({ reason: 'incomplete' })
        .expect(200);

      const res = await request(app)
        .get('/api/v1/admin/schools/pending')
        .set('Authorization', await asAdmin())
        .expect(200);

      const ids = res.body.data.schools.map((s) => String(s._id));
      expect(ids).toContain(String(pending._id));
      expect(ids).not.toContain(String(rejected._id));
    });

    test('status=rejected returns only rejected schools', async () => {
      const pending = await seedOne();
      const rejected = await seedOne();

      await request(app)
        .post(`/api/v1/admin/schools/${rejected._id}/reject`)
        .set('Authorization', await asAdmin())
        .send({ reason: 'incomplete' })
        .expect(200);

      const res = await request(app)
        .get('/api/v1/admin/schools?status=rejected')
        .set('Authorization', await asAdmin())
        .expect(200);

      const ids = res.body.data.schools.map((s) => String(s._id));
      expect(ids).toEqual([String(rejected._id)]);
      expect(ids).not.toContain(String(pending._id));
    });
  });

  describe('list payload', () => {
    test('carries the admin contact details the table renders', async () => {
      await request(app)
        .post('/api/v1/admin/schools')
        .set('Authorization', await asAdmin())
        .send(NEW_SCHOOL)
        .expect(201);

      const res = await request(app)
        .get('/api/v1/admin/schools?status=all')
        .set('Authorization', await asAdmin())
        .expect(200);

      const school = res.body.data.schools.find((s) => s.name === NEW_SCHOOL.schoolName);
      expect(school.adminEmail).toBe(NEW_SCHOOL.email);
      expect(school.adminPhone).toBe(NEW_SCHOOL.mobile);
      expect(school.adminName).toBe(NEW_SCHOOL.fullName);
      expect(school.address.city).toBe('Indore');
    });
  });

  describe('approval email', () => {
    test('approving a school emails the admin that they can now sign in', async () => {
      const email = `approve${Date.now()}@test.com`;
      await registerSchool(app, { email }).expect(200);
      const school = await School.findOne({ adminEmail: email }).lean();

      await request(app)
        .post(`/api/v1/admin/schools/${school._id}/approve`)
        .set('Authorization', await asAdmin())
        .send({})
        .expect(200);

      expect(emailService.sendSchoolApprovedEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: email })
      );
    });

    test('a failing mail server does not roll back the approval', async () => {
      const email = `approve2${Date.now()}@test.com`;
      await registerSchool(app, { email }).expect(200);
      const school = await School.findOne({ adminEmail: email }).lean();

      emailService.sendSchoolApprovedEmail.mockRejectedValueOnce(new Error('SMTP unreachable'));

      await request(app)
        .post(`/api/v1/admin/schools/${school._id}/approve`)
        .set('Authorization', await asAdmin())
        .send({})
        .expect(200);

      const updated = await School.findById(school._id).lean();
      expect(updated.partnerStatus).toBe('active');
    });
  });
});
