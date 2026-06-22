const { NotFoundError, ForbiddenError } = require('../../../common/errors');
const noteRepository = require('../repositories/note.repository');

const noteService = {
  async createNote(userId, schoolId, payload) {
    return noteRepository.create({
      ...payload,
      userId,
      schoolId,
    });
  },

  async listNotes(userId, schoolId, query) {
    const filter = { userId, schoolId };
    if (query.courseId) filter.courseId = query.courseId;
    if (query.lessonId) filter.lessonId = query.lessonId;
    return noteRepository.paginateNotes(filter, query);
  },

  async updateNote(userId, schoolId, noteId, payload) {
    const note = await noteRepository.findOne({ _id: noteId, userId, schoolId });
    if (!note) throw new NotFoundError('Note not found', 'NOTE_NOT_FOUND');
    return noteRepository.updateById(noteId, { $set: payload }, { userId, schoolId });
  },

  async deleteNote(userId, schoolId, noteId) {
    const note = await noteRepository.findOne({ _id: noteId, userId, schoolId });
    if (!note) throw new NotFoundError('Note not found', 'NOTE_NOT_FOUND');
    return noteRepository.softDeleteById(noteId, { deletedBy: userId });
  },

  assertNoteOwner(note, userId) {
    if (String(note.userId) !== String(userId)) {
      throw new ForbiddenError('Notes are private to the owner', 'NOTE_ACCESS_DENIED');
    }
  },
};

module.exports = noteService;
