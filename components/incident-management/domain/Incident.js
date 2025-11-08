class Incident {
  constructor({ id, deviceId, reporterId, severity, status, assignedTo, description }) {
    this.id = id;
    this.deviceId = deviceId;
    this.reporterId = reporterId;
    this.severity = severity;
    this.status = status;
    this.assignedTo = assignedTo;
    this.description = description;
  }
}

module.exports = Incident;
