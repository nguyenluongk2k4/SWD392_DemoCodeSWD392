const Database = require('../shared-kernel/database');
const { SensorData } = require('../database_schemas');
const logger = require('../shared-kernel/utils/logger');

(async () => {
  try {
    await Database.connect();

    const docs = await SensorData.find({}).sort({ timestamp: -1 }).limit(5).populate({
      path: 'sensor',
      populate: ['sensorType', 'farmId', 'zoneId']
    }).lean();

    console.log(JSON.stringify(docs, null, 2));
  } catch (error) {
    console.error('Error printing sensor data:', error);
  } finally {
    await Database.disconnect();
    process.exit(0);
  }
})();
