const Lookup = require('../../../database/models/Lookup');
const LmsCourse = require('../../../database/models/LmsCourse');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../common/errors');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Factory for a small admin-managed picker list (LMS course subjects,
 * target grades, ...) backed by the shared Lookup collection.
 *
 * Lookup's unique index is on { type, code } — NOT { type, group, code } —
 * so a code isn't actually scoped to its group despite every existing caller
 * (school-scoped subjects, this one) treating it that way. A school picking
 * the same conventional code as another school, or as this platform-wide
 * list, would collide on insert. Rather than touch that shared index (other
 * lookup types — section, event_type, homework_type, ... — depend on it and
 * haven't been audited here), every code this factory generates is
 * namespaced with `codePrefix`, plus a duplicate-key retry as a last-resort
 * safety net for a race between the clash check and the insert.
 */
const createLmsTaxonomyService = ({ lookupType, group, codePrefix, itemNoun, courseField }) => {
  const slugifyCode = (label) => {
    const code = String(label)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    return `${codePrefix}${code || 'ITEM'}`;
  };

  return {
    async list() {
      return Lookup.find({ type: lookupType, group }).sort({ displayOrder: 1, label: 1 }).lean();
    },

    async create({ label, displayOrder }) {
      const trimmed = (label || '').trim();
      if (!trimmed) {
        throw new BadRequestError(`${itemNoun} name is required`, null, 'LABEL_REQUIRED');
      }

      const existing = await Lookup.findOne({
        type: lookupType,
        group,
        label: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' },
      }).lean();
      if (existing) {
        throw new ConflictError(`This ${itemNoun.toLowerCase()} already exists`, 'ALREADY_EXISTS');
      }

      let code = slugifyCode(trimmed);
      // Global check (no group) — matches what the real unique index enforces.
      const codeClash = await Lookup.findOne({ type: lookupType, code }).lean();
      if (codeClash) {
        code = `${code}_${Date.now().toString().slice(-4)}`;
      }

      const count = await Lookup.countDocuments({ type: lookupType, group });
      const attempt = (finalCode) =>
        Lookup.create({
          type: lookupType,
          group,
          code: finalCode,
          label: trimmed,
          displayOrder: displayOrder ?? count,
          status: 'active',
        });

      try {
        const doc = await attempt(code);
        return doc.toObject();
      } catch (err) {
        if (err?.code === 11000) {
          const doc = await attempt(`${code}_${Date.now().toString().slice(-4)}`);
          return doc.toObject();
        }
        throw err;
      }
    },

    /**
     * A real delete (not a status flip) — these are just a free-text tag on
     * LmsCourse, not a foreign key, so removing one from the picker list
     * never corrupts an existing course. Still blocked while courses
     * reference it so the picker and the catalog can't silently drift apart.
     */
    async remove(id) {
      const item = await Lookup.findOne({ _id: id, type: lookupType, group });
      if (!item) throw new NotFoundError(`${itemNoun} not found`, 'NOT_FOUND');

      const inUseCount = await LmsCourse.countDocuments({
        [courseField]: item.label,
        'softDelete.isDeleted': { $ne: true },
      });
      if (inUseCount > 0) {
        throw new BadRequestError(
          `${inUseCount} course${inUseCount === 1 ? '' : 's'} still use "${item.label}" — reassign or delete ${inUseCount === 1 ? 'it' : 'them'} first.`,
          null,
          'IN_USE'
        );
      }

      await Lookup.deleteOne({ _id: item._id });
      return { deleted: true };
    },
  };
};

module.exports = { createLmsTaxonomyService };
