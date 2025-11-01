// Debug Controller - Kiểm tra dữ liệu được seeded
const logger = require('../../../shared-kernel/utils/logger');
const {
  Sensor,
  Actuator,
  Farm,
  Zone,
  SensorType,
  ActuatorType,
  User
} = require('../../../database_schemas');

class DebugController {
  async getSeedData(req, res) {
    try {
      const sensors = await Sensor.find({})
        .populate('sensorType')
        .populate('farmId')
        .populate('zoneId');

      const actuators = await Actuator.find({})
        .populate('actuatorType')
        .populate('farmId')
        .populate('zoneId');

      const farms = await Farm.find({})
        .populate('owner');

      const zones = await Zone.find({})
        .populate('farmId');

      const sensorTypes = await SensorType.find({});
      const actuatorTypes = await ActuatorType.find({});
      const users = await User.find({}).populate('role');

      return res.json({
        success: true,
        counts: {
          sensors: sensors.length,
          actuators: actuators.length,
          farms: farms.length,
          zones: zones.length,
          sensorTypes: sensorTypes.length,
          actuatorTypes: actuatorTypes.length,
          users: users.length
        },
        data: {
          sensors: sensors.map(s => ({
            _id: s._id,
            sensorId: s.sensorId,
            name: s.name,
            sensorType: s.sensorType?.name,
            farm: s.farmId?.name,
            zone: s.zoneId?.name,
            status: s.status
          })),
          actuators: actuators.map(a => ({
            _id: a._id,
            deviceId: a.deviceId,
            name: a.name,
            actuatorType: a.actuatorType,
            farm: a.farmId?.name,
            zone: a.zoneId?.name,
            address: a.address,
            status: a.status,
            mode: a.mode
          })),
          farms: farms.map(f => ({
            _id: f._id,
            farmId: f.farmId,
            name: f.name,
            owner: f.owner?.username
          })),
          zones: zones.map(z => ({
            _id: z._id,
            zoneId: z.zoneId,
            name: z.name,
            farm: z.farmId?.name
          }))
        }
      });
    } catch (error) {
      logger.error('Error getting seed data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving debug data',
        error: error.message
      });
    }
  }
}

module.exports = new DebugController();
