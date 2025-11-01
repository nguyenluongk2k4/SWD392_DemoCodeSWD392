// Data Ingestion - Domain - SensorData model alias
// Keep a single source of truth for schema definitions by reusing database_schemas.js models.

const { SensorData } = require('../../../database_schemas');

module.exports = SensorData;
