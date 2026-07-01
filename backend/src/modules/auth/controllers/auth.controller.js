const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const passwordService = require('../services/password.service');
const emailVerificationService = require('../services/emailVerification.service');
const sessionService = require('../services/session.service');
const authorizationService = require('../services/authorization.service');
const { success } = require('../../../common/response');
const { toAuthResponseDto } = require('../dto/auth.dto');
const { messages } = require('../../../constants');
const env = require('../../../config/env');
const security = require('../../../config/security');
const { getRequestMeta } = require('../../../utils/request');
const asyncHandler = require('../../../utils/asyncHandler');

const setRefreshCookie = (res, refreshToken, expiresAt) => {
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
    ...security.cookie,
    expires: expiresAt,
    maxAge: expiresAt.getTime() - Date.now(),
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(env.REFRESH_COOKIE_NAME, {
    ...security.cookie,
  });
};

const sendAuthResponse = (res, req, result, message) => {
  setRefreshCookie(res, result.refreshToken, result.expiresAt);
  return success(
    res,
    toAuthResponseDto({
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    }),
    message,
    undefined,
    req
  );
};

const withRefreshCookieClear = (handler) =>
  asyncHandler(async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      clearRefreshCookie(res);
      throw error;
    }
  });

const authController = {
  login: (expectedRole = null) =>
    asyncHandler(async (req, res) => {
      const result = await authService.loginWithPassword(
        {
          email: req.body.email,
          password: req.body.password,
          expectedRole: expectedRole || req.body.role || null,
        },
        getRequestMeta(req)
      );
      return sendAuthResponse(res, req, result, messages.AUTH.LOGIN_SUCCESS);
    }),

  refresh: withRefreshCookieClear(async (req, res) => {
    const refreshToken =
      req.cookies?.[env.REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;
    const result = await authService.refreshSession(refreshToken, getRequestMeta(req));
    return sendAuthResponse(res, req, result, messages.AUTH.TOKEN_REFRESHED);
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout({
      userId: req.auth.userId,
      jti: req.auth.jti,
      sessionId: req.auth.sessionId,
      revokeAll: req.body.revokeAll,
    });
    clearRefreshCookie(res);
    return success(res, null, messages.AUTH.LOGOUT_SUCCESS, undefined, req);
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.auth.userId);
    return success(res, { user }, undefined, undefined, req);
  }),

  requestParentOtp: (purpose = 'login_parent') =>
    asyncHandler(async (req, res) => {
      const phone = req.body.phone || req.body.mobile;
      const result = await otpService.requestOtp({ phone, purpose }, getRequestMeta(req));
      return success(res, result, messages.AUTH.OTP_SENT, undefined, req);
    }),

  verifyParentOtp: asyncHandler(async (req, res) => {
    const result = await otpService.loginParentWithOtp(
      {
        phone: req.body.phone || req.body.mobile,
        otp: req.body.otp,
        purpose: 'login_parent',
      },
      getRequestMeta(req)
    );
    return sendAuthResponse(res, req, result, messages.AUTH.OTP_VERIFIED);
  }),

  parentWebLogin: asyncHandler(async (req, res) => {
    const result = await otpService.loginParentWithOtp(
      { phone: req.body.mobile, otp: req.body.otp, purpose: 'login_parent' },
      getRequestMeta(req)
    );
    return sendAuthResponse(res, req, result, messages.AUTH.LOGIN_SUCCESS);
  }),

  verifyWebRegisterOtp: asyncHandler(async (req, res) => {
    const result = await otpService.verifyOtp(
      {
        phone: req.body.phone || req.body.mobile,
        otp: req.body.otp,
        purpose: 'web_register',
      },
      getRequestMeta(req),
      { issueSession: false }
    );
    return success(res, result, messages.AUTH.OTP_VERIFIED, undefined, req);
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const result = await passwordService.forgotPassword(
      { email: req.body.email },
      getRequestMeta(req)
    );
    return success(res, null, result.message, undefined, req);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await passwordService.resetPassword(
      { token: req.body.token, newPassword: req.body.newPassword },
      getRequestMeta(req)
    );
    return success(res, null, result.message, undefined, req);
  }),

  changePassword: asyncHandler(async (req, res) => {
    const result = await passwordService.changePassword(
      {
        userId: req.auth.userId,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
        sessionId: req.auth.sessionId,
      },
      getRequestMeta(req)
    );
    return success(res, null, result.message, undefined, req);
  }),

  sendEmailVerification: asyncHandler(async (req, res) => {
    const result = await emailVerificationService.sendVerificationEmail(
      req.auth.userId,
      getRequestMeta(req)
    );
    return success(res, null, result.message, undefined, req);
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const result = await emailVerificationService.verifyEmail(
      { token: req.body.token },
      getRequestMeta(req)
    );
    return success(
      res,
      { alreadyVerified: result.alreadyVerified },
      result.message,
      undefined,
      req
    );
  }),

  listSessions: asyncHandler(async (req, res) => {
    const sessions = await sessionService.listActiveSessions(req.auth.userId, req.auth.jti);
    return success(res, { sessions }, undefined, undefined, req);
  }),

  revokeSession: asyncHandler(async (req, res) => {
    const result = await sessionService.revokeSession({
      userId: req.auth.userId,
      sessionId: req.params.sessionId,
      currentSessionId: req.auth.sessionId,
      currentJti: req.auth.jti,
      requestMeta: getRequestMeta(req),
    });

    if (result.revokedCurrent) {
      clearRefreshCookie(res);
    }

    return success(res, result, messages.AUTH.SESSION_REVOKED_SUCCESS, undefined, req);
  }),

  revokeOtherSessions: asyncHandler(async (req, res) => {
    const result = await sessionService.revokeOtherSessions({
      userId: req.auth.userId,
      currentSessionId: req.auth.sessionId,
      requestMeta: getRequestMeta(req),
    });
    return success(res, result, messages.AUTH.SESSIONS_REVOKED_SUCCESS, undefined, req);
  }),

  getAuthorization: asyncHandler(async (req, res) => {
    const authorization = await authorizationService.getAuthorizationSnapshot(req.auth.userId);
    return success(res, { authorization }, undefined, undefined, req);
  }),

  registerParent: asyncHandler(async (req, res) => {
    const { phone, studentName, grade, classGrade, schoolRefNo } = req.body;
    const { normalizePhone } = require('../../../utils');
    const { ConflictError, BadRequestError } = require('../../../common/errors');
    const { withTransaction } = require('../../../database');
    const { generateUserRefId } = require('../../school/utils/refId');
    const { issueAuthenticatedSession } = require('../services/sessionIssue.service');

    const User = require('../../../database/models/User');
    const ParentProfile = require('../../../database/models/ParentProfile');
    const ChildProfile = require('../../../database/models/ChildProfile');
    const School = require('../../../database/models/School');

    const normalizedPhone = normalizePhone(phone);
    const selectedGrade = classGrade || grade;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ phone: normalizedPhone, role: 'parent', 'softDelete.isDeleted': { $ne: true } });
    if (existingUser) {
      throw new ConflictError('Phone number already registered', 'PHONE_EXISTS');
    }

    // 2. Resolve schoolRefNo
    let school = null;
    if (schoolRefNo) {
      school = await School.findOne({ schoolRefNo, 'softDelete.isDeleted': { $ne: true } });
      if (!school) {
        throw new BadRequestError('Invalid school reference number', null, 'INVALID_SCHOOL_REF');
      }
    }

    // 3. Register user, profile, and child in transaction
    const result = await withTransaction(async (session) => {
      const refId = generateUserRefId('P');

      // Generate a unique referralCode (format EMARTxxxx)
      let referralCode;
      let isUnique = false;
      while (!isUnique) {
        const rand = Math.floor(1000 + Math.random() * 9000); // 4 digits
        referralCode = `EMART${rand}`;
        const match = await ParentProfile.findOne({ referralCode }).session(session);
        if (!match) isUnique = true;
      }

      // Create User
      const userList = await User.create(
        [
          {
            refId,
            role: 'parent',
            status: 'active',
            name: `${studentName} Parent`,
            phone: normalizedPhone,
            phoneVerifiedAt: new Date(),
          },
        ],
        { session }
      );
      const user = userList[0];

      // Create ParentProfile
      const parentProfileList = await ParentProfile.create(
        [
          {
            userId: user._id,
            referralCode,
          },
        ],
        { session }
      );
      const parentProfile = parentProfileList[0];

      // Create ChildProfile
      const childProfileList = await ChildProfile.create(
        [
          {
            parentUserId: user._id,
            name: studentName,
            grade: selectedGrade,
            schoolId: school ? school._id : null,
            schoolRefNo: school ? school.schoolRefNo : null,
          },
        ],
        { session }
      );
      const childProfile = childProfileList[0];

      // Link child as activeChildId in ParentProfile
      await ParentProfile.findByIdAndUpdate(
        parentProfile._id,
        { $set: { activeChildId: childProfile._id } },
        { session }
      );

      return user;
    });

    // 4. Issue session and return auth tokens
    const sessionResponse = await issueAuthenticatedSession(result, getRequestMeta(req), 'auth.register.parent.success');
    
    // Add childProfile details to the user DTO returned
    if (sessionResponse.user) {
      sessionResponse.user.childProfile = {
        name: studentName,
        grade: selectedGrade,
        schoolId: school ? school._id : 'explore-schools',
        schoolName: school ? school.name : 'Explore Schools',
        schoolRefNo: school ? school.schoolRefNo : null,
      };
    }

    return sendAuthResponse(res, req, sessionResponse, 'Registration successful');
  }),

  registerTeacher: asyncHandler(async (req, res) => {
    const { fullName, email, mobile, schoolCode, password } = req.body;
    const { normalizePhone, normalizeEmail } = require('../../../utils');
    const { BadRequestError, ConflictError } = require('../../../common/errors');
    const teacherService = require('../../school/services/teacher.service');
    const School = require('../../../database/models/School');
    const User = require('../../../database/models/User');

    const normalizedPhone = normalizePhone(mobile);
    const normalizedEmail = normalizeEmail(email);

    // 1. Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      'softDelete.isDeleted': { $ne: true }
    });
    if (existingUser) {
      throw new ConflictError('Email or mobile number already registered', 'USER_EXISTS');
    }

    // 2. Resolve schoolCode
    const normalizedCode = schoolCode.trim().toUpperCase();
    const school = await School.findOne({
      $or: [{ schoolRefNo: normalizedCode }, { code: normalizedCode }],
      'softDelete.isDeleted': { $ne: true },
    });
    if (!school) {
      throw new BadRequestError('Invalid school code', null, 'INVALID_SCHOOL_REF');
    }

    // 3. Create teacher profile
    const { user } = await teacherService.createTeacher(school._id, {
      name: fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: password,
      autoApprove: true,
      classAssignments: [
        { class: 'Class 5', section: 'Section A' },
        { class: 'Class 5', section: 'Section B' },
        { class: 'Class 6', section: 'Section A' },
        { class: 'Class 6', section: 'Section B' }
      ]
    });

    // 4. Issue authenticated session
    const { issueAuthenticatedSession } = require('../services/sessionIssue.service');
    const sessionResponse = await issueAuthenticatedSession(user, getRequestMeta(req), 'auth.register.teacher.success');

    return sendAuthResponse(res, req, sessionResponse, 'Teacher registration successful');
  }),

  registerSchoolAdmin: asyncHandler(async (req, res) => {
    const schoolAdminRegistrationService = require('../../school/services/schoolAdminRegistration.service');
    const { issueAuthenticatedSession } = require('../services/sessionIssue.service');

    const { user, schoolRefNo } = await schoolAdminRegistrationService.register(req.body);
    const sessionResponse = await issueAuthenticatedSession(user, getRequestMeta(req), 'auth.register.school.success');

    if (sessionResponse.user) {
      sessionResponse.user.schoolRefNo = schoolRefNo;
    }

    return sendAuthResponse(res, req, sessionResponse, 'School registration successful');
  }),
};

module.exports = authController;
