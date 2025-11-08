const DeviceStatus = require('../domain/DeviceStatus');

class DeviceStatusRepository {
  async fetchLatestByDeviceId(deviceId) {
    return new DeviceStatus({
      deviceId,
      status: 'unknown',
      lastSeen: null,
      healthScore: 0,
      metadata: {
        flow: 'DeviceStatusRepository.fetchLatestByDeviceId -> DeviceStatusService -> controller',
      },
    });
  }

  async fetchSummaryByZone(zoneId) {
    return {
      zoneId,
      devices: [],
      flow: 'DeviceStatusRepository.fetchSummaryByZone -> DeviceStatusService -> websockets',
    };
  }
}

module.exports = DeviceStatusRepository;
