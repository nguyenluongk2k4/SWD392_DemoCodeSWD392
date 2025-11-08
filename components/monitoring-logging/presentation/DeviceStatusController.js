const express = require('express');
const DeviceStatusService = require('../application/DeviceStatusService');
const ResponseHandler = require('../../../shared-kernel/utils/response');

const router = express.Router();
const service = new DeviceStatusService();

router.get('/:deviceId', async (req, res) => {
  const result = await service.getCurrentStatus(req.params.deviceId);
  return ResponseHandler.success(res, result, 'Device status flow placeholder');
});

router.post('/zone/:zoneId/broadcast', async (req, res) => {
  const result = await service.broadcastLatestStatus(req.params.zoneId);
  return ResponseHandler.success(res, result, 'Device status broadcast flow placeholder');
});

router.get('/zone/:zoneId', async (req, res) => {
  const result = await service.getZoneSummary(req.params.zoneId);
  return ResponseHandler.success(res, result, 'Device status summary flow placeholder');
});

module.exports = router;
