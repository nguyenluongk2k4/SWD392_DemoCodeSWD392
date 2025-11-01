import React, { useState, useEffect } from 'react';
import '../../styles/components/_management.css';

const SensorManagement = ({ onLog }) => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSensorId, setSelectedSensorId] = useState(null);
  const [formData, setFormData] = useState({
    sensorId: '',
    name: '',
    sensorType: '',
    status: 'active'
  });

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/debug/seed-data`);
      const data = await response.json();
      setSensors(data.data.sensors || []);
      onLog('Loaded sensors successfully', 'success');
    } catch (error) {
      onLog(`Error loading sensors: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        setSensors(sensors.map(s => s._id === editingId ? { ...formData, _id: editingId } : s));
        onLog('Sensor updated successfully', 'success');
      } else {
        setSensors([...sensors, { ...formData, _id: Date.now().toString() }]);
        onLog('Sensor added successfully', 'success');
      }
      resetForm();
    } catch (error) {
      onLog(`Error: ${error.message}`, 'error');
    }
  };

  const handleEdit = (sensor) => {
    setFormData(sensor);
    setEditingId(sensor._id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setSensors(sensors.filter(s => s._id !== id));
    onLog('Sensor deleted successfully', 'success');
  };

  const resetForm = () => {
    setFormData({
      sensorId: '',
      name: '',
      sensorType: '',
      status: 'active'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleViewLogs = (sensorId) => {
    setSelectedSensorId(sensorId);
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2><i className="fas fa-microchip"></i> Quản Lí Sensors</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus"></i> {showForm ? 'Cancel' : 'Add Sensor'}
        </button>
      </div>

      {showForm && (
        <form className="form-section" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Sensor ID"
              value={formData.sensorId}
              onChange={(e) => setFormData({ ...formData, sensorId: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Sensor Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <select
              value={formData.sensorType}
              onChange={(e) => setFormData({ ...formData, sensorType: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="soil-moisture">Soil Moisture</option>
              <option value="light">Light</option>
              <option value="ph">pH</option>
              <option value="co2">CO₂</option>
            </select>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success">
            {editingId ? 'Update' : 'Add'} Sensor
          </button>
        </form>
      )}

      {selectedSensorId && (
        <SensorLogs sensorId={selectedSensorId} onClose={() => setSelectedSensorId(null)} />
      )}

      <div className="table-responsive">
        {loading ? (
          <div className="loading">Loading sensors...</div>
        ) : sensors.length === 0 ? (
          <div className="loading">No sensors found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sensor ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((sensor) => (
                <tr key={sensor._id}>
                  <td>{sensor.sensorId}</td>
                  <td>{sensor.name}</td>
                  <td>{sensor.sensorType}</td>
                  <td>
                    <span className={`status-badge status-${sensor.status}`}>
                      {sensor.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-small btn-primary" onClick={() => handleViewLogs(sensor.sensorId)}>
                      <i className="fas fa-history"></i> Logs
                    </button>
                    <button className="btn-small btn-info" onClick={() => handleEdit(sensor)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-small btn-danger" onClick={() => handleDelete(sensor._id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

const SensorLogs = ({ sensorId, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    loadLogs();
  }, [sensorId]);

  const loadLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/demo/sensor-data?sensorId=${sensorId}`);
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      // Extract sensor data from nested structure
      let logsData = [];
      if (data.data && data.data.sensorData && Array.isArray(data.data.sensorData)) {
        // API returns: data.data.sensorData array
        logsData = data.data.sensorData;
      } else if (Array.isArray(data.data)) {
        // Fallback: data.data is already an array
        logsData = data.data;
      } else if (data.data && typeof data.data === 'object') {
        // Fallback: look for readings or sensorReadings property
        logsData = data.data.readings || data.data.sensorReadings || [];
      }
      
      console.log('Extracted logs data:', logsData); // Debug log
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Sensor Logs: {sensorId}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading logs...</div>
          ) : !Array.isArray(logs) || logs.length === 0 ? (
            <div className="loading">No logs available</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Value</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index}>
                    <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                    <td>{log.value || 'N/A'}</td>
                    <td>
                      <span className={`quality-badge quality-${log.quality || 'unknown'}`}>
                        {log.quality || 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorManagement;
