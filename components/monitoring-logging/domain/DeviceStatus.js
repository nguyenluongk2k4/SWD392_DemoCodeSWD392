class DeviceStatus {
  constructor({ deviceId, status, lastSeen, healthScore, metadata }) {
    this.deviceId = deviceId;
    this.status = status;
    this.lastSeen = lastSeen;
    this.healthScore = healthScore;
    this.metadata = metadata;
  }
}

module.exports = DeviceStatus;
