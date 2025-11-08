class BackupJob {
  constructor({ id, scope, status, location, checksum }) {
    this.id = id;
    this.scope = scope;
    this.status = status;
    this.location = location;
    this.checksum = checksum;
  }
}

module.exports = BackupJob;
