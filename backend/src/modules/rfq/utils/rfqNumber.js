const Rfq = require('../../../database/models/Rfq');

const generateRfqNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;

  const latest = await Rfq.findOne({
    rfqNumber: { $regex: `^${prefix}` },
    'softDelete.isDeleted': { $ne: true },
  })
    .sort({ rfqNumber: -1 })
    .select('rfqNumber')
    .lean();

  let seq = 1;
  if (latest?.rfqNumber) {
    const parts = latest.rfqNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
};

module.exports = { generateRfqNumber };
