const express = require('express');
const IncidentService = require('../application/IncidentService');
const ResponseHandler = require('../../../shared-kernel/utils/response');

const router = express.Router();
const service = new IncidentService();

router.post('/', async (req, res) => {
  const incident = await service.reportIncident({
    id: req.body.id || 'placeholder-id',
    deviceId: req.body.deviceId,
    reporterId: req.body.reporterId,
    severity: req.body.severity || 'medium',
    status: 'new',
    assignedTo: req.body.assignedTo,
    description: req.body.description,
  });

  return ResponseHandler.created(res, incident, 'Incident flow placeholder');
});

router.patch('/:incidentId/status', async (req, res) => {
  const result = await service.updateStatus(req.params.incidentId, req.body.status);
  return ResponseHandler.success(res, result, 'Incident status update flow placeholder');
});

module.exports = router;
