// Automation Engine - Domain - Automation Task model alias
// Delegates to central Mongoose schema to avoid duplication.

const { AutomationTask } = require('../../../database_schemas');

module.exports = AutomationTask;
