const PhonebookEntry = require('../../../database/models/PhonebookEntry');
const { NotFoundError } = require('../../../common/errors');
const { classGradeQuery, classGradeMatches } = require('../../school/utils/classGrade');

const notDeleted = { 'softDelete.isDeleted': { $ne: true } };

// Sections reach the DB in two shapes — bare ("A") from student registration
// and prefixed ("Section A") from the teacher-assignment screen — so strip the
// optional "Section " prefix and compare case-insensitively. Without this a
// Class 5 "A" student never matched a teacher assigned to "Section A".
const normalizeSection = (value) =>
  String(value || '').trim().replace(/^section\s*/i, '').trim().toLowerCase();
const sectionMatches = (a, b) => normalizeSection(a) === normalizeSection(b);

const phonebookService = {
  async listEntries(schoolId, query = {}) {
    const filter = { schoolId, ...notDeleted };
    // Parents only ever get active entries; the school admin page passes
    // includeInactive=true so it can manage (and re-activate) hidden numbers.
    if (String(query.includeInactive) !== 'true') filter.status = 'active';
    if (query.department) filter.department = query.department;
    if (query.category) filter.category = query.category;
    return PhonebookEntry.find(filter).sort({ displayOrder: 1, name: 1 }).lean();
  },

  async createEntry(schoolId, payload) {
    const entry = await PhonebookEntry.create({ schoolId, ...payload });
    return entry.toObject();
  },

  async updateEntry(schoolId, entryId, payload) {
    const entry = await PhonebookEntry.findOneAndUpdate(
      { _id: entryId, schoolId, ...notDeleted },
      { $set: payload },
      { new: true }
    ).lean();
    if (!entry) throw new NotFoundError('Phonebook entry not found', 'PHONEBOOK_NOT_FOUND');
    return entry;
  },

  async deleteEntry(schoolId, entryId, deletedBy) {
    const entry = await PhonebookEntry.findOneAndUpdate(
      { _id: entryId, schoolId, ...notDeleted },
      {
        $set: {
          'softDelete.isDeleted': true,
          'softDelete.deletedAt': new Date(),
          'softDelete.deletedBy': deletedBy,
        },
      },
      { new: true }
    ).lean();
    if (!entry) throw new NotFoundError('Phonebook entry not found', 'PHONEBOOK_NOT_FOUND');
    return entry;
  },

  // Parent-facing directory. Returns only the teachers relevant to the given
  // student — the class teacher and the subject teachers assigned to that
  // student's exact class + section — plus the school's active emergency/general
  // numbers. A Class 5 parent never sees teachers of other classes.
  async getParentContacts(schoolId, { studentId } = {}) {
    const Student = require('../../../database/models/Student');
    const TeacherProfile = require('../../../database/models/TeacherProfile');
    const User = require('../../../database/models/User');

    // Emergency/general numbers are school-wide and shown to every parent.
    const entries = await this.listEntries(schoolId);
    const emergency = entries.filter((e) => e.category === 'emergency');
    const general = entries.filter((e) => e.category !== 'emergency');

    let teachers = [];

    if (studentId) {
      const student = await Student.findOne({ _id: studentId, schoolId, ...notDeleted })
        .select('classGrade section')
        .lean();

      if (student?.classGrade && student?.section) {
        const cls = String(student.classGrade);
        const sec = String(student.section);

        // Approved, visible teachers who have an assignment for this class in
        // either stored shape ("5" or "Class 5"). The exact class+section pair
        // is confirmed in JS below so a "5" student still matches a "Class 5"
        // assignment and vice-versa.
        const profiles = await TeacherProfile.find({
          schoolId,
          approvalStatus: 'approved',
          showInPhonebook: { $ne: false },
          'classAssignments.class': classGradeQuery(cls),
          ...notDeleted,
        }).lean();

        const userMap = new Map();
        if (profiles.length) {
          const users = await User.find({
            _id: { $in: profiles.map((p) => p.userId) },
            status: 'active',
            ...notDeleted,
          })
            .select('name phone email')
            .lean();
          users.forEach((u) => userMap.set(String(u._id), u));
        }

        teachers = profiles
          .map((profile) => {
            const user = userMap.get(String(profile.userId));
            if (!user || !user.phone) return null; // skip deactivated / phone-less

            // Confirm the exact class+section (the DB query only matched class).
            // A teacher assigned to 5-A must not surface for a 5-B student.
            const assignment = (profile.classAssignments || []).find(
              (a) => classGradeMatches(a.class, cls) && sectionMatches(a.section, sec)
            );
            if (!assignment) return null;

            return {
              id: String(profile._id),
              name: user.name,
              phone: user.phone,
              email: user.email || '',
              designation: profile.designation || '',
              department: profile.department || '',
              avatarUrl: profile.avatarUrl || null,
              isClassTeacher: Boolean(assignment.isClassTeacher),
              subjects: assignment.subjects || [],
              role: assignment.isClassTeacher ? 'Class Teacher' : 'Subject Teacher',
            };
          })
          .filter(Boolean)
          // Class teacher(s) first, then alphabetical
          .sort((a, b) => {
            if (a.isClassTeacher !== b.isClassTeacher) return a.isClassTeacher ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
      }
    }

    return { teachers, emergency, general };
  },
};

module.exports = phonebookService;
