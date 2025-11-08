const BackupJob = require('../domain/BackupJob');

class BackupRepository {
  async createJob(scope) {
    return new BackupJob({
      id: 'backup-job-placeholder',
      scope,
      status: 'running',
      location: null,
      checksum: null,
    });
  }

  async completeJob(job, location, checksum) {
    return {
      ...job,
      status: 'completed',
      location,
      checksum,
      flow: 'BackupRepository.completeJob -> BackupService -> notification',
    };
  }
}

module.exports = BackupRepository;
