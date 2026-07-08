const Event = require('../../../database/models/Event');
const { NotFoundError } = require('../../../common/errors');
const { executePaginatedQuery } = require('../../../repositories');

const notDeleted = { 'softDelete.isDeleted': { $ne: true } };

const eventsService = {
  async createEvent(schoolId, payload) {
    const event = await Event.create({
      schoolId,
      title: payload.title,
      description: payload.description,
      eventType: payload.eventType,
      startDate: payload.startDate,
      endDate: payload.endDate || payload.startDate,
      location: payload.location,
      targetAudience: payload.targetAudience || 'all',
      targetClasses: payload.targetClasses || [],
      status: 'upcoming',
    });
    return event.toObject();
  },

  async listEvents(schoolId, query = {}) {
    const filter = { schoolId, ...notDeleted };
    if (query.status) filter.status = query.status;
    if (query.eventType) filter.eventType = query.eventType;
    if (query.from || query.to) {
      filter.startDate = {};
      if (query.from) filter.startDate.$gte = new Date(query.from);
      if (query.to) filter.startDate.$lte = new Date(query.to);
    }
    return executePaginatedQuery(Event, filter, query, { defaultSort: 'startDate' });
  },

  async getEvent(schoolId, eventId) {
    const event = await Event.findOne({ _id: eventId, schoolId, ...notDeleted }).lean();
    if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
    return event;
  },

  async updateEvent(schoolId, eventId, payload) {
    const event = await Event.findOneAndUpdate(
      { _id: eventId, schoolId, ...notDeleted },
      { $set: payload },
      { new: true }
    ).lean();
    if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
    return event;
  },

  async deleteEvent(schoolId, eventId, deletedBy) {
    const event = await Event.findOneAndUpdate(
      { _id: eventId, schoolId, ...notDeleted },
      {
        $set: {
          'softDelete.isDeleted': true,
          'softDelete.deletedAt': new Date(),
          'softDelete.deletedBy': deletedBy,
        },
      },
      { new: true }
    ).lean();
    if (!event) throw new NotFoundError('Event not found', 'EVENT_NOT_FOUND');
    return event;
  },
};

module.exports = eventsService;
