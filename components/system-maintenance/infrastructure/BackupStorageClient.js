class BackupStorageClient {
  async uploadArchive(job) {
    return {
      jobId: job.id,
      location: 's3://placeholder/bucket/archive.tar.gz',
      flow: 'BackupStorageClient.uploadArchive -> external storage',
    };
  }

  async fetchArchive(location) {
    return {
      location,
      flow: 'BackupStorageClient.fetchArchive -> RestoreService -> database',
    };
  }
}

module.exports = BackupStorageClient;
