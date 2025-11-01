import React, { useState, useEffect } from 'react';
import '../../styles/components/_management.css';

const ActuatorManagement = ({ onLog }) => {
  const [actuators, setActuators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    actuatorType: '',
    status: 'off',
    mode: 'manual'
  });

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    loadActuators();
  }, []);

  const loadActuators = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/debug/seed-data`);
      const data = await response.json();
      setActuators(data.data.actuators || []);
      onLog('Loaded actuators successfully', 'success');
    } catch (error) {
      onLog(`Error loading actuators: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        setActuators(actuators.map(a => a._id === editingId ? { ...formData, _id: editingId } : a));
        onLog('Actuator updated successfully', 'success');
      } else {
        setActuators([...actuators, { ...formData, _id: Date.now().toString() }]);
        onLog('Actuator added successfully', 'success');
      }
      resetForm();
    } catch (error) {
      onLog(`Error: ${error.message}`, 'error');
    }
  };

  const handleEdit = (actuator) => {
    setFormData(actuator);
    setEditingId(actuator._id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setActuators(actuators.filter(a => a._id !== id));
    onLog('Actuator deleted successfully', 'success');
  };

  const handleToggle = (id) => {
    setActuators(actuators.map(a =>
      a._id === id ? { ...a, status: a.status === 'on' ? 'off' : 'on' } : a
    ));
    onLog('Actuator toggled successfully', 'success');
  };

  const resetForm = () => {
    setFormData({
      deviceId: '',
      name: '',
      actuatorType: '',
      status: 'off',
      mode: 'manual'
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2><i className="fas fa-sliders-h"></i> Quản Lí Actuators</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus"></i> {showForm ? 'Cancel' : 'Add Actuator'}
        </button>
      </div>

      {showForm && (
        <form className="form-section" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Device ID"
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Actuator Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <select
              value={formData.actuatorType}
              onChange={(e) => setFormData({ ...formData, actuatorType: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              <option value="pump">Pump</option>
              <option value="fan">Fan</option>
              <option value="valve">Valve</option>
              <option value="light">Light</option>
            </select>
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success">
            {editingId ? 'Update' : 'Add'} Actuator
          </button>
        </form>
      )}

      <div className="table-responsive">
        {loading ? (
          <div className="loading">Loading actuators...</div>
        ) : actuators.length === 0 ? (
          <div className="loading">No actuators found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Zone</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {actuators.map((actuator) => (
                <tr key={actuator._id}>
                  <td>{actuator.deviceId}</td>
                  <td>{actuator.name}</td>
                  <td>{actuator.actuatorType}</td>
                  <td>{actuator.zone}</td>
                  <td>
                    <span className={`mode-badge mode-${actuator.mode}`}>
                      {actuator.mode}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${actuator.status}`}>
                      {actuator.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`btn-small btn-${actuator.status === 'on' ? 'danger' : 'success'}`}
                      onClick={() => handleToggle(actuator._id)}
                    >
                      <i className={`fas fa-power-off`}></i>
                    </button>
                    <button className="btn-small btn-info" onClick={() => handleEdit(actuator)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-small btn-danger" onClick={() => handleDelete(actuator._id)}>
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

export default ActuatorManagement;
