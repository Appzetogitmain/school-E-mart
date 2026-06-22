const { Joi, schemas } = require('../../../common/validation');

const objectId = schemas.objectId;
const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().trim().optional(),
  fields: Joi.string().trim().optional(),
  search: Joi.string().trim().max(120).optional(),
};

const schoolIdParam = Joi.object({ schoolId: objectId.required() });
const classGradeParam = schoolIdParam.keys({ classGrade: Joi.string().trim().required() });
const sectionParam = classGradeParam.keys({ section: Joi.string().trim().required() });

const createSchoolSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  code: Joi.string().trim().max(32).optional(),
  principalName: Joi.string().trim().max(80).optional(),
  adminEmail: schemas.email.optional(),
  schoolRefNo: Joi.string().trim().required(),
  address: Joi.object({
    line1: Joi.string().trim().optional(),
    line2: Joi.string().trim().optional(),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().optional(),
    country: Joi.string().trim().optional(),
    pinCode: Joi.string().trim().optional(),
  }).optional(),
  partnerStatus: Joi.string().valid('prospect', 'active', 'suspended').default('prospect'),
  academicYearCurrent: Joi.string().trim().optional(),
  gradesOffered: Joi.array().items(Joi.string().trim()).optional(),
  sectionsConfig: Joi.array()
    .items(
      Joi.object({
        class: Joi.string().trim().required(),
        sections: Joi.array().items(Joi.string().trim()).default([]),
      })
    )
    .optional(),
});

const updateSchoolSchema = createSchoolSchema.fork(
  ['name', 'schoolRefNo'],
  (schema) => schema.optional()
);

const createTeacherSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: schemas.email.required(),
  phone: schemas.indianMobile.required(),
  password: schemas.password.required(),
  employeeId: Joi.string().trim().optional(),
  designation: Joi.string().trim().optional(),
  department: Joi.string().trim().optional(),
  qualification: Joi.string().trim().optional(),
  experienceYears: Joi.number().min(0).optional(),
  joiningDate: Joi.date().optional(),
  subjectsTaught: Joi.array().items(Joi.string().trim()).optional(),
  classAssignments: Joi.array()
    .items(
      Joi.object({
        class: Joi.string().trim().required(),
        section: Joi.string().trim().required(),
      })
    )
    .optional(),
  autoApprove: Joi.boolean().default(true),
});

const updateTeacherSchema = Joi.object({
  designation: Joi.string().trim().optional(),
  department: Joi.string().trim().optional(),
  qualification: Joi.string().trim().optional(),
  experienceYears: Joi.number().min(0).optional(),
  subjectsTaught: Joi.array().items(Joi.string().trim()).optional(),
  classAssignments: Joi.array()
    .items(
      Joi.object({
        class: Joi.string().trim().required(),
        section: Joi.string().trim().required(),
      })
    )
    .optional(),
  user: Joi.object({
    name: Joi.string().trim().optional(),
    phone: schemas.indianMobile.optional(),
    email: schemas.email.optional(),
  }).optional(),
});

const teacherStatusSchema = Joi.object({
  approvalStatus: Joi.string().valid('approved', 'rejected', 'pending').required(),
  rejectionReason: Joi.string().trim().max(300).optional(),
});

const createClassSchema = Joi.object({
  classGrade: Joi.string().trim().required(),
  sections: Joi.array().items(Joi.string().trim()).default([]),
});

const updateClassSchema = Joi.object({
  newClassGrade: Joi.string().trim().optional(),
  sections: Joi.array().items(Joi.string().trim()).optional(),
});

const createSectionSchema = Joi.object({ section: Joi.string().trim().required() });
const updateSectionSchema = Joi.object({ newSection: Joi.string().trim().required() });
const assignStudentsSchema = Joi.object({
  studentIds: Joi.array().items(objectId).min(1).required(),
});

const createStudentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  schoolRefNo: Joi.string().trim().optional(),
  rollNo: Joi.string().trim().optional(),
  classGrade: Joi.string().trim().required(),
  section: Joi.string().trim().required(),
  status: Joi.string().valid('active', 'inactive', 'alumni').default('active'),
  dob: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'unspecified').optional(),
  bloodGroup: Joi.string().trim().optional(),
  parentUserId: objectId.optional(),
  parentProfileIds: Joi.array().items(objectId).optional(),
});

const updateStudentSchema = createStudentSchema.fork(
  ['name', 'classGrade', 'section'],
  (schema) => schema.optional()
);

const transferStudentSchema = Joi.object({
  classGrade: Joi.string().trim().required(),
  section: Joi.string().trim().required(),
});

const studentStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'alumni').required(),
});

const subjectSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
  label: Joi.string().trim().required(),
  displayOrder: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});

const assignSubjectSchema = Joi.object({
  classGrade: Joi.string().trim().required(),
  section: Joi.string().trim().required(),
  subjectCode: Joi.string().trim().required(),
  teacherProfileId: objectId.required(),
});

const markAttendanceSchema = Joi.object({
  date: Joi.date().required(),
  classGrade: Joi.string().trim().required(),
  section: Joi.string().trim().required(),
  records: Joi.array()
    .items(
      Joi.object({
        studentId: objectId.required(),
        status: Joi.string().valid('present', 'absent', 'half_day', 'holiday', 'leave').required(),
        remarks: Joi.string().trim().max(300).optional(),
      })
    )
    .min(1)
    .required(),
});

const attendanceQuerySchema = Joi.object({
  ...paginationQuery,
  studentId: objectId.optional(),
  date: Joi.date().optional(),
  status: Joi.string().valid('present', 'absent', 'half_day', 'holiday', 'leave').optional(),
  classGrade: Joi.string().trim().optional(),
  section: Joi.string().trim().optional(),
});

const monthlyAttendanceQuerySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  classGrade: Joi.string().trim().optional(),
  section: Joi.string().trim().optional(),
});

const timetableSlotSchema = Joi.object({
  academicYear: Joi.string().trim().required(),
  classGrade: Joi.string().trim().required(),
  section: Joi.string().trim().required(),
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  periodNumber: Joi.number().integer().min(1).required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  subjectCode: Joi.string().trim().required(),
  teacherProfileId: objectId.required(),
  room: Joi.string().trim().optional(),
});

const timetableQuerySchema = Joi.object({
  ...paginationQuery,
  academicYear: Joi.string().trim().optional(),
  classGrade: Joi.string().trim().optional(),
  section: Joi.string().trim().optional(),
  teacherProfileId: objectId.optional(),
  dayOfWeek: Joi.number().integer().min(0).max(6).optional(),
});

const assignClassTeacherSchema = Joi.object({
  section: Joi.string().trim().required(),
  teacherProfileId: objectId.required(),
});

module.exports = {
  paginationQuery,
  schoolIdParam,
  classGradeParam,
  sectionParam,
  createSchoolSchema,
  updateSchoolSchema,
  createTeacherSchema,
  updateTeacherSchema,
  teacherStatusSchema,
  createClassSchema,
  updateClassSchema,
  createSectionSchema,
  updateSectionSchema,
  assignStudentsSchema,
  createStudentSchema,
  updateStudentSchema,
  transferStudentSchema,
  studentStatusSchema,
  subjectSchema,
  assignSubjectSchema,
  markAttendanceSchema,
  attendanceQuerySchema,
  monthlyAttendanceQuerySchema,
  timetableSlotSchema,
  timetableQuerySchema,
  assignClassTeacherSchema,
  updateSubjectSchema: subjectSchema.fork(['code'], (schema) => schema.optional()),
  updateAttendanceSchema: Joi.object({
    status: Joi.string().valid('present', 'absent', 'half_day', 'holiday', 'leave').optional(),
    remarks: Joi.string().trim().max(300).optional(),
  }),
  teacherIdParam: schoolIdParam.keys({ teacherId: objectId.required() }),
  studentIdParam: schoolIdParam.keys({ studentId: objectId.required() }),
  subjectCodeParam: schoolIdParam.keys({ code: Joi.string().trim().required() }),
  slotIdParam: schoolIdParam.keys({ slotId: objectId.required() }),
  attendanceIdParam: schoolIdParam.keys({ attendanceId: objectId.required() }),
};
