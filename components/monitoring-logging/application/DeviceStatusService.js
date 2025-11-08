const { eventBus, Events } = require('../../../shared-kernel/event-bus');
const DeviceStatusRepository = require('../infrastructure/DeviceStatusRepository');

class DeviceStatusService {
  constructor({ repository } = {}) {
    this.repository = repository || new DeviceStatusRepository();
  }

  async getCurrentStatus(deviceId) {
    const status = await this.repository.fetchLatestByDeviceId(deviceId);
    return {
      deviceId: status.deviceId,
      status: status.status,
      lastSeen: status.lastSeen,
      healthScore: status.healthScore,
      flow: 'DeviceStatusService.getCurrentStatus -> repository -> return to controller',
    };
  }

  async broadcastLatestStatus(zoneId) {
    eventBus.publish(Events.DEVICE_STATUS_CHANGED, {
      zoneId,
      source: 'DeviceStatusService.broadcastLatestStatus',
    });

    return {
      zoneId,
      flow: 'DeviceStatusService.broadcastLatestStatus -> eventBus -> WebSocketGateway',
    };
  }

  async getZoneSummary(zoneId) {
    const summary = await this.repository.fetchSummaryByZone(zoneId);
    return {
      ...summary,
      flow: 'DeviceStatusService.getZoneSummary -> repository summary',
    };
  }
}

module.exports = DeviceStatusService;
