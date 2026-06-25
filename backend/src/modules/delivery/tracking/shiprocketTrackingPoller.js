const logger = require('../../../common/logger');
const DeliveryShipment = require('../../../database/models/DeliveryShipment');
const { shiprocketService } = require('../providers/shiprocket/shiprocketService');

const pollTrackingJob = async (job) => {
  const { orderId, awbCode } = job.data;
  if (!awbCode) return;
  const tracking = await shiprocketService.getTrackingInfo({ awbCode });
  if (!tracking) return;

  await DeliveryShipment.findOneAndUpdate(
    { orderId },
    {
      $set: { currentStatus: tracking.currentStatus || null },
      $push: {
        timeline: {
          status: tracking.currentStatus || 'UNKNOWN',
          timestamp: new Date(),
          location: tracking.location || null,
          raw: tracking,
        },
      },
    }
  );
  logger.info('Shiprocket tracking polled', { orderId, awbCode, status: tracking.currentStatus || null });
};

module.exports = {
  pollTrackingJob,
};
