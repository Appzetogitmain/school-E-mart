const PhonebookEntry = require('../../../database/models/PhonebookEntry');
const { NotFoundError } = require('../../../common/errors');

const notDeleted = { 'softDelete.isDeleted': { $ne: true } };

const phonebookService = {
  async listEntries(schoolId, query = {}) {
    const filter = { schoolId, status: 'active', ...notDeleted };
    if (query.department) filter.department = query.department;
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
};

module.exports = phonebookService;
