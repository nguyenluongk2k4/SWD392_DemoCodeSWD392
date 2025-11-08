const Incident = require('../domain/Incident');

class IncidentRepository {
  async createIncident(payload) {
    return new Incident({
      ...payload,
      status: 'new',
      flow: 'IncidentRepository.createIncident -> IncidentService -> NotificationService',
    });
  }

  async updateIncidentStatus(incidentId, status) {
    return {
      incidentId,
      status,
      flow: 'IncidentRepository.updateIncidentStatus -> IncidentService -> eventBus',
    };
  }
}

module.exports = IncidentRepository;
