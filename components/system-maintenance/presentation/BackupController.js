const express = require('express');
const BackupService = require('../application/BackupService');
const RestoreService = require('../application/RestoreService');
const ResponseHandler = require('../../../shared-kernel/utils/response');

const router = express.Router();
const backupService = new BackupService();
const restoreService = new RestoreService();

router.post('/backup', async (req, res) => {
  const result = await backupService.startBackup(req.body.scope);
  return ResponseHandler.success(res, result, 'Backup flow placeholder');
});

router.post('/restore', async (req, res) => {
  const result = await restoreService.startRestore(req.body.location, req.body.target);
  return ResponseHandler.success(res, result, 'Restore flow placeholder');
});

module.exports = router;
