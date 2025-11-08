const { eventBus, Events } = require('../../../shared-kernel/event-bus');
const BackupStorageClient = require('../infrastructure/BackupStorageClient');

class RestoreService {
  constructor({ storageClient } = {}) {
    this.storageClient = storageClient || new BackupStorageClient();
  }

  async startRestore(location, target = 'staging') {
    const archive = await this.storageClient.fetchArchive(location);

    eventBus.publish(Events.ALERT_CREATED, {
      type: 'system',
      severity: 'medium',
      flow: 'RestoreService.startRestore -> event bus -> observers',
    });

    return {
      location: archive.location,
      target,
      flow: 'RestoreService.startRestore -> storage client -> database restore placeholder',
    };
  }
}

module.exports = RestoreService;
