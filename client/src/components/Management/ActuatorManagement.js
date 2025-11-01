import React, { useState, useEffect } from 'react';
import '../../styles/components/_management.css';

const ActuatorManagement = ({ onLog }) => {
  const [actuators, setActuators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedActuator, setSelectedActuator] = useState(null);
  const [showGrpcModal, setShowGrpcModal] = useState(false);
  const [grpcLoading, setGrpcLoading] = useState(false);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    actuatorType: '',
    status: 'off',
    mode: 'manual',
    address: '0.0.0.0:50051'
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
        // Update existing actuator
        const response = await fetch(`${API_BASE}/api/devices/${formData.deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            address: formData.address,
            mode: formData.mode,
            status: formData.status
          })
        });

        const data = await response.json();
        if (data.success) {
          setActuators(actuators.map(a => a._id === editingId ? data.data : a));
          onLog('Actuator updated successfully', 'success');
        } else {
          onLog(`Error: ${data.message}`, 'error');
        }
      } else {
        // Create new actuator
        const response = await fetch(`${API_BASE}/api/devices/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deviceId: formData.deviceId,
            name: formData.name,
            address: formData.address,
            type: formData.actuatorType,
            mode: formData.mode,
            status: formData.status
          })
        });

        const data = await response.json();
        if (data.success) {
          setActuators([...actuators, data.data]);
          onLog('Actuator added successfully', 'success');
        } else {
          onLog(`Error: ${data.message}`, 'error');
        }
      }
      resetForm();
    } catch (error) {
      onLog(`Error: ${error.message}`, 'error');
    }
  };

  const handleEdit = (actuator) => {
    // Extract proper values from actuator object
    const actuatorTypeId = typeof actuator.actuatorType === 'object' 
      ? actuator.actuatorType?._id 
      : actuator.actuatorType;
    
    setFormData({
      deviceId: actuator.deviceId || '',
      name: actuator.name || '',
      actuatorType: actuator.actuatorType?.name || actuatorTypeId || '',
      status: actuator.status || 'off',
      mode: actuator.mode || 'manual',
      address: actuator.address || '0.0.0.0:50051'
    });
    setEditingId(actuator._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const actuatorToDelete = actuators.find(a => a._id === id);
    if (!actuatorToDelete) return;

    try {
      const response = await fetch(`${API_BASE}/api/devices/${actuatorToDelete.deviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setActuators(actuators.filter(a => a._id !== id));
        onLog('Actuator deleted successfully', 'success');
      } else {
        onLog(`Error: ${data.message}`, 'error');
      }
    } catch (error) {
      onLog(`Error deleting actuator: ${error.message}`, 'error');
    }
  };

  const handleOpenGrpcModal = (actuator) => {
    setSelectedActuator(actuator);
    setShowGrpcModal(true);
  };

  const handleGrpcControl = async (action) => {
    if (!selectedActuator) return;

    setGrpcLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/devices/grpc/control/${selectedActuator.deviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          address: selectedActuator.address
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local actuator status
        const updatedActuators = actuators.map(a =>
          a._id === selectedActuator._id
            ? {
                ...a,
                status: action === 'TURN_ON' ? 'ON' : 'OFF',
                lastCommand: action
              }
            : a
        );
        setActuators(updatedActuators);
        setSelectedActuator({
          ...selectedActuator,
          status: action === 'TURN_ON' ? 'ON' : 'OFF'
        });
        
        onLog(`Actuator ${action === 'TURN_ON' ? 'turned on' : 'turned off'} via gRPC`, 'success');
      } else {
        onLog(`gRPC error: ${data.message}`, 'error');
      }
    } catch (error) {
      onLog(`Error controlling actuator: ${error.message}`, 'error');
    } finally {
      setGrpcLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      deviceId: '',
      name: '',
      actuatorType: '',
      status: 'off',
      mode: 'manual',
      address: '0.0.0.0:50051'
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
            <input
              type="text"
              placeholder="gRPC Address (e.g., 0.0.0.0:50051)"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
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
          </div>
          <div className="form-row">
            <select
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
              <option value="error">Error</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success">
            {editingId ? 'Update' : 'Add'} Actuator
          </button>
        </form>
      )}

      {showGrpcModal && selectedActuator && (
        <GrpcControlModal
          actuator={selectedActuator}
          onClose={() => setShowGrpcModal(false)}
          onControl={handleGrpcControl}
          loading={grpcLoading}
        />
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
                <th style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Device ID</th>
                <th style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Name</th>
                <th style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Type</th>
                <th style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>gRPC Address</th>
                <th style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Mode</th>
                <th style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Status</th>
                <th style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {actuators.map((actuator) => (
                <tr key={actuator._id}>
                  <td>{actuator.deviceId}</td>
                  <td>{actuator.name}</td>
                  <td>
                    {typeof actuator.actuatorType === 'object' 
                      ? actuator.actuatorType?.displayName || actuator.actuatorType?.name 
                      : actuator.actuatorType}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '500', color: '#0066cc' }}>
                    {actuator.address || 'N/A'}
                  </td>
                  <td>
                    <span className={`mode-badge mode-${actuator.mode?.toLowerCase()}`}>
                      {actuator.mode}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${actuator.status?.toLowerCase()}`}>
                      {actuator.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-small btn-warning"
                      onClick={() => handleOpenGrpcModal(actuator)}
                      title="Control via gRPC"
                    >
                      <i className="fas fa-network-wired"></i> gRPC
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

const GrpcControlModal = ({ actuator, onClose, onControl, loading }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-network-wired"></i> gRPC Control: {actuator.name}</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Device ID:</strong> {actuator.deviceId}</p>
            <p><strong>gRPC Address:</strong> <code>{actuator.address}</code></p>
            <p><strong>Current Status:</strong> <span className={`status-badge status-${actuator.status?.toLowerCase()}`}>{actuator.status}</span></p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              className="btn btn-success"
              onClick={() => onControl('TURN_ON')}
              disabled={loading || actuator.status?.toUpperCase() === 'ON'}
              style={{ flex: 1 }}
            >
              {loading ? 'Processing...' : <><i className="fas fa-toggle-on"></i> Turn ON</>}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => onControl('TURN_OFF')}
              disabled={loading || actuator.status?.toUpperCase() === 'OFF'}
              style={{ flex: 1 }}
            >
              {loading ? 'Processing...' : <><i className="fas fa-toggle-off"></i> Turn OFF</>}
            </button>
          </div>

          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
              ℹ️ This will send a gRPC command to the actuator at the specified address.
              The status will be updated in the database upon successful response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActuatorManagement;
