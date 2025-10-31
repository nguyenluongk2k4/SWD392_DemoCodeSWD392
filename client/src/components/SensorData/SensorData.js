import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/components/_sensorData.css';

const SensorData = ({ onLog }) => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const API_BASE = 'http://localhost:3000';

  const loadSensorData = useCallback(async () => {
    try {
      setLoading(true);
      const url = filter
        ? `${API_BASE}/api/demo/sensor-data?sensorId=${filter}`
        : `${API_BASE}/api/demo/sensor-data`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        setSensorData(data.data.sensorData || []);
        onLog(`Loaded ${data.data.total || 0} sensor records`, 'success');
      } else {
        onLog('Failed to load sensor data', 'error');
      }
    } catch (error) {
      onLog(`Network error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, onLog, API_BASE]);

  useEffect(() => {
    loadSensorData();
  }, [loadSensorData]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const getSensorIcon = (type) => {
    const icons = {
      'temperature': 'fas fa-thermometer-half',
      'soil-moisture': 'fas fa-tint',
      'light': 'fas fa-sun',
      'humidity': 'fas fa-water'
    };
    return icons[type] || 'fas fa-sensor';
  };

  const getSensorUnit = (type) => {
    const units = {
      'temperature': '°C',
      'soil-moisture': '%',
      'light': 'lux',
      'humidity': '%'
    };
    return units[type] || '';
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2><i className="fas fa-chart-line"></i> Sensor Data</h2>
        <div className="card-actions">
          <button className="btn btn-primary" onClick={loadSensorData}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <select
            className="form-control"
            value={filter}
            onChange={handleFilterChange}
          >
            <option value="">All Sensors</option>
            <option value="temp-sensor-01">Temperature Sensor 01</option>
            <option value="moisture-sensor-01">Moisture Sensor 01</option>
            <option value="light-sensor-01">Light Sensor 01</option>
            <option value="humidity-sensor-01">Humidity Sensor 01</option>
          </select>
        </div>
      </div>
      <div className="card-body">
        <div className="sensor-grid">
          {loading ? (
            <div className="loading">Loading sensor data...</div>
          ) : sensorData.length === 0 ? (
            <div className="loading">No sensor data available</div>
          ) : (
            sensorData.map((sensor, index) => (
              <SensorCard
                key={`${sensor.sensorId}-${index}`}
                sensor={sensor}
                icon={getSensorIcon(sensor.sensorType)}
                unit={getSensorUnit(sensor.sensorType)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const SensorCard = ({ sensor, icon, unit }) => {
  return (
    <div className="sensor-card">
      <div className="sensor-header">
        <div className="sensor-title">
          <i className={icon}></i> {sensor.sensorId}
        </div>
        <div className="sensor-type">{sensor.sensorType}</div>
      </div>
      <div className="sensor-value">
        {sensor.value}<span className="sensor-unit">{unit}</span>
      </div>
      <div className="sensor-details">
        <div><strong>Zone:</strong> {sensor.farmZone}</div>
        <div><strong>Time:</strong> {new Date(sensor.timestamp).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default SensorData;