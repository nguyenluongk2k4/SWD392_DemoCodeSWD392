// Shared Kernel - Default Data Seeder
// Populates baseline master data required for demo sensors and automation flows.

const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const {
  SensorType,
  Sensor,
  ActuatorType,
  Farm,
  Zone,
  Actuator,
  Role,
  User
} = require('../../database_schemas');

const SENSOR_TYPE_DEFINITIONS = [
  {
    name: 'temperature',
    displayName: 'Temperature',
    unit: '°C',
    description: 'Ambient temperature sensor',
    minValue: -20,
    maxValue: 60
  },
  {
    name: 'humidity',
    displayName: 'Humidity',
    unit: '%',
    description: 'Air humidity sensor',
    minValue: 0,
    maxValue: 100
  },
  {
    name: 'soil-moisture',
    displayName: 'Soil Moisture',
    unit: '%',
    description: 'Soil volumetric water content sensor',
    minValue: 0,
    maxValue: 100
  },
  {
    name: 'light',
    displayName: 'Light Intensity',
    unit: 'lux',
    description: 'Light intensity sensor',
    minValue: 0,
    maxValue: 120000
  },
  {
    name: 'ph',
    displayName: 'pH Level',
    unit: 'pH',
    description: 'Nutrient solution pH sensor',
    minValue: 0,
    maxValue: 14
  },
  {
    name: 'co2',
    displayName: 'CO₂ Concentration',
    unit: 'ppm',
    description: 'CO₂ concentration sensor',
    minValue: 0,
    maxValue: 5000
  }
];

const SENSOR_DEFINITIONS = [
  {
    sensorId: 'temp-sensor-01',
    sensorType: 'temperature',
    name: 'Temperature Sensor 01',
    farmId: 'farm-001',
    zoneId: 'zone-1a'
  },
  {
    sensorId: 'moisture-sensor-01',
    sensorType: 'soil-moisture',
    name: 'Soil Moisture Sensor 01',
    farmId: 'farm-001',
    zoneId: 'zone-1a'
  },
  {
    sensorId: 'light-sensor-01',
    sensorType: 'light',
    name: 'Light Sensor 01',
    farmId: 'farm-001',
    zoneId: 'zone-1b'
  },
  {
    sensorId: 'humidity-sensor-01',
    sensorType: 'humidity',
    name: 'Humidity Sensor 01',
    farmId: 'farm-001',
    zoneId: 'zone-1b'
  }
];

const ACTUATOR_TYPE_DEFINITIONS = [
  {
    name: 'pump',
    displayName: 'Irrigation Pump',
    capabilities: ['on/off'],
    description: 'Water pump actuator'
  },
  {
    name: 'fan',
    displayName: 'Ventilation Fan',
    capabilities: ['on/off', 'speed-control'],
    description: 'Air circulation fan'
  }
];

const FARM_DEFINITIONS = [
  {
    farmId: 'farm-001',
    name: 'Demo Farm',
    description: 'Default demonstration smart farm',
    location: {
      latitude: 21.0278,
      longitude: 105.8342,
      altitude: 15,
      address: 'Hanoi, Vietnam'
    },
    area: 50,
    ownerUsername: 'admin'
  }
];

const ZONE_DEFINITIONS = [
  {
    zoneId: 'zone-1a',
    name: 'Greenhouse North',
    description: 'Northern greenhouse block',
    farmId: 'farm-001',
    cropType: 'Leafy Greens'
  },
  {
    zoneId: 'zone-1b',
    name: 'Greenhouse South',
    description: 'Southern greenhouse block',
    farmId: 'farm-001',
    cropType: 'Tomatoes'
  }
];

const ACTUATOR_DEFINITIONS = [
  {
    deviceId: 'pump-01',
    actuatorType: 'pump',
    name: 'Irrigation Pump 01',
    farmId: 'farm-001',
    zoneId: 'zone-1a'
  },
  {
    deviceId: 'fan-01',
    actuatorType: 'fan',
    name: 'Ventilation Fan 01',
    farmId: 'farm-001',
    zoneId: 'zone-1b'
  }
];

class DefaultDataSeeder {
  constructor() {
    this.sensorTypeCache = new Map();
    this.actuatorTypeCache = new Map();
    this.farmCache = new Map();
    this.zoneCache = new Map();
    this.adminUser = null;
  }

  async seed() {
    await this.ensureSensorTypes();
    await this.ensureActuatorTypes();
    await this.ensureAdminUser();
    await this.ensureFarms();
    await this.ensureZones();
    await this.ensureSensors();
    await this.ensureActuators();
  }

  async ensureSensorTypes() {
    this.sensorTypeCache.clear();
    for (const definition of SENSOR_TYPE_DEFINITIONS) {
      const doc = await SensorType.findOneAndUpdate(
        { name: definition.name },
        { $setOnInsert: definition },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      this.sensorTypeCache.set(definition.name, doc);
    }
    logger.info('Default sensor types ensured');
  }

  async ensureSensors() {
    for (const definition of SENSOR_DEFINITIONS) {
      const sensorTypeDoc = this.sensorTypeCache.get(definition.sensorType);
      if (!sensorTypeDoc) {
        logger.warn(`Skipping sensor seed for ${definition.sensorId} - sensor type ${definition.sensorType} missing`);
        continue;
      }

      const farmDoc = this.farmCache.get(definition.farmId);
      const zoneDoc = this.zoneCache.get(definition.zoneId);

      if (!farmDoc || !zoneDoc) {
        logger.warn(`Skipping sensor seed for ${definition.sensorId} - farm ${definition.farmId} or zone ${definition.zoneId} missing`);
        continue;
      }

      await Sensor.findOneAndUpdate(
        { sensorId: definition.sensorId },
        {
          $setOnInsert: {
            sensorId: definition.sensorId,
            sensorType: sensorTypeDoc._id,
            name: definition.name,
            farmId: farmDoc._id,
            zoneId: zoneDoc._id,
            status: 'active',
            installationDate: new Date(),
            metadata: {
              manufacturer: 'Demo Manufacturer',
              model: 'Demo Model'
            }
          }
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
    logger.info('Default sensors ensured');
  }

  async ensureActuatorTypes() {
    this.actuatorTypeCache.clear();
    for (const definition of ACTUATOR_TYPE_DEFINITIONS) {
      const doc = await ActuatorType.findOneAndUpdate(
        { name: definition.name },
        { $setOnInsert: definition },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      this.actuatorTypeCache.set(definition.name, doc);
    }
    logger.info('Default actuator types ensured');
  }

  async ensureAdminUser() {
    if (this.adminUser) {
      return this.adminUser;
    }

    let adminUser = await User.findOne({ username: 'admin' });
    if (adminUser) {
      this.adminUser = adminUser;
      logger.info('Default admin user already exists');
      return adminUser;
    }

    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      logger.warn('Cannot seed default admin user - admin role not found');
      return null;
    }

    const password = await bcrypt.hash('Admin@123', 10);

    adminUser = await User.create({
      username: 'admin',
      email: 'admin@smartagri.local',
      password,
      fullName: 'System Administrator',
      phoneNumber: '+840123456789',
      role: adminRole._id,
      isActive: true
    });

    this.adminUser = adminUser;
    logger.info('Default admin user ensured');
    return adminUser;
  }

  async ensureFarms() {
    if (!this.adminUser) {
      logger.warn('Skipping farm seeding - admin user not available');
      return;
    }

    for (const definition of FARM_DEFINITIONS) {
      const { ownerUsername, ...farmData } = definition;
      const doc = await Farm.findOneAndUpdate(
        { farmId: definition.farmId },
        {
          $setOnInsert: {
            ...farmData,
            owner: this.adminUser._id
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      this.farmCache.set(definition.farmId, doc);
    }

    logger.info('Default farms ensured');
  }

  async ensureZones() {
    for (const definition of ZONE_DEFINITIONS) {
      const farmDoc = this.farmCache.get(definition.farmId);
      if (!farmDoc) {
        logger.warn(`Skipping zone seed for ${definition.zoneId} - farm ${definition.farmId} missing`);
        continue;
      }

      const doc = await Zone.findOneAndUpdate(
        { zoneId: definition.zoneId },
        {
          $setOnInsert: {
            ...definition,
            farmId: farmDoc._id
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      this.zoneCache.set(definition.zoneId, doc);
    }

    logger.info('Default zones ensured');
  }

  async ensureActuators() {
    for (const definition of ACTUATOR_DEFINITIONS) {
      const actuatorTypeDoc = this.actuatorTypeCache.get(definition.actuatorType);
      const farmDoc = this.farmCache.get(definition.farmId);
      const zoneDoc = this.zoneCache.get(definition.zoneId);

      if (!actuatorTypeDoc || !farmDoc || !zoneDoc) {
        logger.warn(`Skipping actuator seed for ${definition.deviceId} - missing master data`);
        continue;
      }

      await Actuator.findOneAndUpdate(
        { deviceId: definition.deviceId },
        {
          $setOnInsert: {
            deviceId: definition.deviceId,
            actuatorType: actuatorTypeDoc._id,
            name: definition.name,
            farmId: farmDoc._id,
            zoneId: zoneDoc._id,
            status: 'off',
            mode: 'auto'
          }
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    logger.info('Default actuators ensured');
  }
}

module.exports = new DefaultDataSeeder();
