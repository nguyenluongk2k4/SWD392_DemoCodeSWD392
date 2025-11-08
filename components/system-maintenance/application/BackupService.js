const { eventBus, Events } = require('../../../shared-kernel/event-bus');
const BackupRepository = require('../infrastructure/BackupRepository');
const BackupStorageClient = require('../infrastructure/BackupStorageClient');

class BackupService {
  constructor({ repository, storageClient } = {}) {
    this.repository = repository || new BackupRepository();
    this.storageClient = storageClient || new BackupStorageClient();
  }

  async startBackup(scope = 'full-db') {
    const job = await this.repository.createJob(scope);
    const uploadResult = await this.storageClient.uploadArchive(job);
    const completed = await this.repository.completeJob(job, uploadResult.location, 'checksum-placeholder');

    eventBus.publish(Events.ALERT_CREATED, {
      type: 'system',
      severity: 'low',
      flow: 'BackupService.startBackup -> event bus -> observers',
    });

    return {
      ...completed,
      flow: 'BackupService.startBackup -> repository -> storage -> event bus',
    };
  }
}

module.exports = BackupService;
