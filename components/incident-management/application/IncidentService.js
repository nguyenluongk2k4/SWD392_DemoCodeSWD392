const { eventBus, Events } = require('../../../shared-kernel/event-bus');
const IncidentRepository = require('../infrastructure/IncidentRepository');

class IncidentService {
  constructor({ repository } = {}) {
    this.repository = repository || new IncidentRepository();
  }

  async reportIncident(payload) {
    const incident = await this.repository.createIncident(payload);

    eventBus.publish(Events.INCIDENT_REPORTED, {
      incidentId: incident.id,
      deviceId: incident.deviceId,
      flow: 'IncidentService.reportIncident -> event bus -> NotificationService',
    });

    return incident;
  }

  async updateStatus(incidentId, status) {
    const result = await this.repository.updateIncidentStatus(incidentId, status);

    return {
      ...result,
      flow: 'IncidentService.updateStatus -> repository -> downstream handlers',
    };
  }
}

module.exports = IncidentService;
