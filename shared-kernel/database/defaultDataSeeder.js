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
  // Farm 001 - Zone 1a (Rau xanh)
  {
    sensorId: 'temp-sensor-01',
    sensorType: 'temperature',
    name: 'Temperature Sensor - Zone 1A',
    farmId: 'farm-001',
    zoneId: 'zone-1a'
  },
  {
    sensorId: 'moisture-sensor-01',
    sensorType: 'soil-moisture',
    name: 'Soil Moisture Sensor - Zone 1A',
    farmId: 'farm-001',
    zoneId: 'zone-1a'
  },
  {
    sensorId: 'humidity-sensor-01',
    sensorType: 'humidity',
    name: 'Humidity Sensor - Zone 1A',
    farmId: 'farm-001',
    zoneId: 'zone-1a'
  },
  // Farm 001 - Zone 1b (Cà chua)
  {
    sensorId: 'temp-sensor-02',
    sensorType: 'temperature',
    name: 'Temperature Sensor - Zone 1B',
    farmId: 'farm-001',
    zoneId: 'zone-1b'
  },
  {
    sensorId: 'light-sensor-01',
    sensorType: 'light',
    name: 'Light Sensor - Zone 1B',
    farmId: 'farm-001',
    zoneId: 'zone-1b'
  },
  {
    sensorId: 'ph-sensor-01',
    sensorType: 'ph',
    name: 'pH Sensor - Zone 1B',
    farmId: 'farm-001',
    zoneId: 'zone-1b'
  },
  // Farm 002 - Zone 2a (Rau hữu cơ)
  {
    sensorId: 'temp-sensor-03',
    sensorType: 'temperature',
    name: 'Temperature Sensor - Zone 2A',
    farmId: 'farm-002',
    zoneId: 'zone-2a'
  },
  {
    sensorId: 'moisture-sensor-02',
    sensorType: 'soil-moisture',
    name: 'Soil Moisture Sensor - Zone 2A',
    farmId: 'farm-002',
    zoneId: 'zone-2a'
  },
  // Farm 003 - Zone 3a (Hydroponic)
  {
    sensorId: 'ph-sensor-02',
    sensorType: 'ph',
    name: 'pH Sensor - Hydroponic Zone 3A',
    farmId: 'farm-003',
    zoneId: 'zone-3a'
  },
  {
    sensorId: 'co2-sensor-01',
    sensorType: 'co2',
    name: 'CO₂ Sensor - Hydroponic Zone 3A',
    farmId: 'farm-003',
    zoneId: 'zone-3a'
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
    name: 'Smart Farm Hà Nội',
    description: 'Demo smart farm with IoT sensors and automation',
    location: {
      latitude: 21.0278,
      longitude: 105.8342,
      altitude: 15,
      address: 'Thanh Trì, Hà Nội, Việt Nam'
    },
    area: 50,
    ownerUsername: 'admin'
  },
  {
    farmId: 'farm-002',
    name: 'Organic Farm Đà Lạt',
    description: 'Highland organic vegetable farm',
    location: {
      latitude: 11.9404,
      longitude: 108.4583,
      altitude: 1500,
      address: 'Đà Lạt, Lâm Đồng, Việt Nam'
    },
    area: 100,
    ownerUsername: 'admin'
  },
  {
    farmId: 'farm-003',
    name: 'Hydroponic Farm TP.HCM',
    description: 'Urban hydroponic system for fresh vegetables',
    location: {
      latitude: 10.8231,
      longitude: 106.6297,
      altitude: 5,
      address: 'Quận 12, TP. Hồ Chí Minh, Việt Nam'
    },
    area: 30,
    ownerUsername: 'admin'
  }
];

const ZONE_DEFINITIONS = [
  // Farm 001 Zones
  {
    zoneId: 'zone-1a',
    name: 'Nhà kính A - Rau xanh',
    description: 'Greenhouse zone for leafy vegetables',
    farmId: 'farm-001',
    zoneType: 'greenhouse',
    area: 15,
    cropType: 'Leafy Greens',
    isActive: true
  },
  {
    zoneId: 'zone-1b',
    name: 'Nhà kính B - Cà chua',
    description: 'Greenhouse zone for tomatoes',
    farmId: 'farm-001',
    zoneType: 'greenhouse',
    area: 20,
    cropType: 'Tomatoes',
    isActive: true
  },
  {
    zoneId: 'zone-1c',
    name: 'Vùng ngoài trời',
    description: 'Outdoor cultivation area',
    farmId: 'farm-001',
    zoneType: 'outdoor',
    area: 15,
    cropType: 'Mixed Vegetables',
    isActive: true
  },
  // Farm 002 Zones
  {
    zoneId: 'zone-2a',
    name: 'Khu A - Rau hữu cơ',
    description: 'Organic vegetable zone A',
    farmId: 'farm-002',
    zoneType: 'outdoor',
    area: 40,
    cropType: 'Organic Vegetables',
    isActive: true
  },
  {
    zoneId: 'zone-2b',
    name: 'Khu B - Dâu tây',
    description: 'Strawberry cultivation zone',
    farmId: 'farm-002',
    zoneType: 'greenhouse',
    area: 30,
    cropType: 'Strawberries',
    isActive: true
  },
  {
    zoneId: 'zone-2c',
    name: 'Khu C - Hoa',
    description: 'Flower cultivation zone',
    farmId: 'farm-002',
    zoneType: 'greenhouse',
    area: 30,
    cropType: 'Flowers',
    isActive: true
  },
  // Farm 003 Zones
  {
    zoneId: 'zone-3a',
    name: 'Hệ thống Hydroponic 1',
    description: 'Hydroponic system for lettuce',
    farmId: 'farm-003',
    zoneType: 'indoor',
    area: 10,
    cropType: 'Lettuce',
    isActive: true
  },
  {
    zoneId: 'zone-3b',
    name: 'Hệ thống Hydroponic 2',
    description: 'Hydroponic system for herbs',
    farmId: 'farm-003',
    zoneType: 'indoor',
    area: 10,
    cropType: 'Herbs',
    isActive: true
  },
  {
    zoneId: 'zone-3c',
    name: 'Hệ thống NFT',
    description: 'NFT (Nutrient Film Technique) system',
    farmId: 'farm-003',
    zoneType: 'indoor',
    area: 10,
    cropType: 'Microgreens',
    isActive: true
  }
];

const ACTUATOR_DEFINITIONS = [
  // Farm 001 Actuators
  {
    deviceId: 'pump-main-zone-123',
    actuatorType: 'pump',
    name: 'Water Pump - Zone 1A',
    farmId: 'farm-001',
    zoneId: 'zone-1a',
    address: '0.0.0.0:50051',
    status: 'OFF',
    mode: 'MANUAL'
  },
  {
    deviceId: 'fan-zone-A',
    actuatorType: 'fan',
    name: 'Ventilation Fan - Zone 1B',
    farmId: 'farm-001',
    zoneId: 'zone-1b',
    address: '0.0.0.0:50051',
    status: 'OFF',
    mode: 'MANUAL'
  },
  {
    deviceId: 'pump-zone-1b',
    actuatorType: 'pump',
    name: 'Water Pump - Zone 1B',
    farmId: 'farm-001',
    zoneId: 'zone-1b',
    address: '0.0.0.0:50051',
    status: 'OFF',
    mode: 'MANUAL'
  },
  // Farm 002 Actuators
  {
    deviceId: 'pump-zone-2a',
    actuatorType: 'pump',
    name: 'Irrigation Pump - Zone 2A',
    farmId: 'farm-002',
    zoneId: 'zone-2a',
    address: '0.0.0.0:50051',
    status: 'OFF',
    mode: 'MANUAL'
  },
  {
    deviceId: 'fan-zone-2b',
    actuatorType: 'fan',
    name: 'Greenhouse Fan - Zone 2B',
    farmId: 'farm-002',
    zoneId: 'zone-2b',
    address: '0.0.0.0:50051',
    status: 'OFF',
    mode: 'MANUAL'
  },
  // Farm 003 Actuators
  {
    deviceId: 'pump-hydro-3a',
    actuatorType: 'pump',
    name: 'Nutrient Pump - Hydroponic 3A',
    farmId: 'farm-003',
    zoneId: 'zone-3a',
    address: '0.0.0.0:50051',
    status: 'OFF',
    mode: 'MANUAL'
  },
  {
    deviceId: 'fan-hydro-3a',
    actuatorType: 'fan',
    name: 'Circulation Fan - Hydroponic 3A',
    farmId: 'farm-003',
    zoneId: 'zone-3a',
    address: '0.0.0.0:50051',
    status: 'OFF',
    mode: 'MANUAL'
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
            address: definition.address || '0.0.0.0:50051',
            status: definition.status || 'off',
            mode: definition.mode || 'manual'
          }
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    logger.info('Default actuators ensured');
  }
}

module.exports = new DefaultDataSeeder();
