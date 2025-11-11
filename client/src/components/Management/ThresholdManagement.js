import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/components/_management.css';
import API_CONFIG from '../../config/api.config';

const ThresholdManagement = ({ onLog }) => {
  const [thresholds, setThresholds] = useState([]);
  const [farms, setFarms] = useState([]);
  const [zones, setZones] = useState([]);
  const [sensorTypes, setSensorTypes] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sensorType: '',
    minValue: '',
    maxValue: '',
    farmId: '',
    zoneId: '',
    action: {
      type: 'alert',
      actuator: '',
      deviceAction: 'on',
      alertType: 'all',
      recipients: '',
      priority: 'medium'
    },
    isActive: true
  });

  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedFarm) {
      loadZonesByFarm(selectedFarm);
      loadActuatorsByFarm(selectedFarm);
    } else {
      // Reset zones and actuators when no farm selected
      setZones([]);
      setActuators([]);
      setFormData((prev) => {
        if (!prev.zoneId && !prev.action?.actuator) {
          return prev;
        }
        return {
          ...prev,
          zoneId: '',
          action: {
            ...prev.action,
            actuator: ''
          }
        };
      });
    }
  }, [selectedFarm]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load farms from real API
      const farmsResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.FARMS));
      const farmsData = await farmsResponse.json();
      console.log('Farms API response:', farmsData);
      if (farmsData.success) {
        console.log('Farms loaded:', farmsData.data);
        setFarms(farmsData.data || []);
      } else {
        console.error('Failed to load farms:', farmsData);
        setFarms([]);
      }
      
      // Load sensor types from real API
      const sensorTypesResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SENSOR_TYPES));
      const sensorTypesData = await sensorTypesResponse.json();
      console.log('Sensor types API response:', sensorTypesData);
      if (sensorTypesData.success) {
        console.log('Sensor types loaded:', sensorTypesData.data);
        setSensorTypes(sensorTypesData.data || []);
      } else {
        console.error('Failed to load sensor types:', sensorTypesData);
        setSensorTypes([]);
      }
      
      // Load thresholds from API
      const thresholdResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.THRESHOLDS));
      const thresholdData = await thresholdResponse.json();
      
      if (thresholdData.success) {
        setThresholds(thresholdData.data || []);
        onLog('✅ Loaded thresholds from database', 'success');
      } else {
        setThresholds([]);
        onLog('ℹ️ No thresholds found', 'info');
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      onLog(`❌ Error loading data: ${error.message}`, 'error');
      setThresholds([]);
    } finally {
      setLoading(false);
    }
  };

  const loadZonesByFarm = async (farmId) => {
    try {
      console.log('Loading zones for farm:', farmId);
      // Load zones from real API
      const response = await fetch(API_CONFIG.getFarmZonesUrl(farmId));
      const data = await response.json();
      console.log('Zones API response:', data);
      if (data.success) {
        console.log('Zones loaded:', data.data);
        setZones(data.data || []);
      } else {
        console.error('Failed to load zones:', data);
        setZones([]);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
      onLog(`Error loading zones: ${error.message}`, 'error');
      setZones([]);
    }
  };

  const loadActuatorsByFarm = async (farmId) => {
    try {
      // Load actuators from seed data filtered by farmId
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.DEBUG_SEED_DATA));
      const data = await response.json();
      const allActuators = data?.data?.actuators ?? [];
      const filteredActuators = allActuators.filter((actuator) => {
        const farmValue = actuator.farmId?._id || actuator.farmId || actuator.farmCode;
        return farmValue === farmId;
      });
      setActuators(filteredActuators);
    } catch (error) {
      onLog(`Error loading actuators: ${error.message}`, 'error');
      setActuators([]);
    }
  };

  const availableActuators = useMemo(() => {
    if (!formData.zoneId) {
      return actuators;
    }

    return actuators.filter((actuator) => {
      const zoneValue = actuator.zoneId?._id || actuator.zoneId || actuator.zoneCode;
      return zoneValue === formData.zoneId;
    });
  }, [actuators, formData.zoneId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate minValue < maxValue
    if (parseFloat(formData.minValue) >= parseFloat(formData.maxValue)) {
      onLog('Min value must be less than max value', 'error');
      return;
    }

    try {
      const thresholdData = {
        ...formData,
        minValue: parseFloat(formData.minValue),
        maxValue: parseFloat(formData.maxValue),
        action: {
          ...formData.action,
          recipients: formData.action.recipients.split(',').map(r => r.trim()).filter(r => r)
        }
      };

      if (editingId) {
        // Update threshold
        const response = await fetch(API_CONFIG.getThresholdUrl(editingId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(thresholdData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          setThresholds(thresholds.map(t => 
            t._id === editingId ? result.data : t
          ));
          onLog('Threshold updated successfully', 'success');
        } else {
          throw new Error(result.message || 'Failed to update threshold');
        }
      } else {
        // Create threshold
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.THRESHOLDS), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(thresholdData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          setThresholds([...thresholds, result.data]);
          onLog('Threshold created successfully', 'success');
        } else {
          throw new Error(result.message || 'Failed to create threshold');
        }
      }
      
      resetForm();
    } catch (error) {
      onLog(`Error: ${error.message}`, 'error');
    }
  };

  const handleEdit = (threshold) => {
    const normalizedFarmId = threshold.farmId?._id || threshold.farmId || '';
    const normalizedZoneId = threshold.zoneId?._id || threshold.zoneId || '';
    const normalizedSensorType = threshold.sensorType?._id || threshold.sensorType || '';
    const normalizedActuator = threshold.action?.actuator?._id || threshold.action?.actuator || '';

    setFormData({
      ...threshold,
      name: threshold.name || '',
      sensorType: normalizedSensorType,
      minValue: threshold.minValue?.toString() || '',
      maxValue: threshold.maxValue?.toString() || '',
      farmId: normalizedFarmId,
      zoneId: normalizedZoneId,
      action: {
        type: threshold.action?.type || 'alert',
        actuator: normalizedActuator,
        deviceAction: threshold.action?.deviceAction || 'on',
        alertType: threshold.action?.alertType || 'all',
        recipients: threshold.action?.recipients?.join(', ') || '',
        priority: threshold.action?.priority || 'medium'
      },
      isActive: threshold.isActive ?? true
    });
    setEditingId(threshold._id);
    setSelectedFarm(normalizedFarmId);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this threshold?')) return;
    
    try {
      const response = await fetch(API_CONFIG.getThresholdUrl(id), { 
        method: 'DELETE' 
      });
      
      const result = await response.json();
      
      if (result.success) {
        setThresholds(thresholds.filter(t => t._id !== id));
        onLog('Threshold deleted successfully', 'success');
      } else {
        throw new Error(result.message || 'Failed to delete threshold');
      }
    } catch (error) {
      onLog(`Error deleting threshold: ${error.message}`, 'error');
    }
  };

  const toggleActive = async (threshold) => {
    try {
      const newStatus = !threshold.isActive;
      
      const response = await fetch(`${API_CONFIG.getThresholdUrl(threshold._id)}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setThresholds(thresholds.map(t => 
          t._id === threshold._id ? result.data : t
        ));
        onLog(`Threshold ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      } else {
        throw new Error(result.message || 'Failed to toggle threshold');
      }
    } catch (error) {
      onLog(`Error: ${error.message}`, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sensorType: '',
      minValue: '',
      maxValue: '',
      farmId: '',
      zoneId: '',
      action: {
        type: 'alert',
        actuator: '',
        deviceAction: 'on',
        alertType: 'all',
        recipients: '',
        priority: 'medium'
      },
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
    setSelectedFarm('');
  };

  const resolveId = (value) => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value._id || value.id || value.value;
    }
    return undefined;
  };

  const getSensorTypeName = (sensorType) => {
    if (sensorType && typeof sensorType === 'object') {
      return sensorType.displayName || sensorType.name || 'Unknown';
    }

    const sensorTypeId = resolveId(sensorType);
    const type = sensorTypes.find(st => st._id === sensorTypeId);
    return type?.displayName || type?.name || 'Unknown';
  };

  const getFarmName = (farm) => {
    if (farm && typeof farm === 'object') {
      return farm.name || farm.farmName || 'Unknown';
    }

    const farmId = resolveId(farm);
    const matchedFarm = farms.find(f => f._id === farmId);
    return matchedFarm?.name || 'Unknown';
  };

  const getZoneName = (zone) => {
    if (zone && typeof zone === 'object') {
      return zone.name || zone.zoneName || 'Unknown';
    }

    const zoneId = resolveId(zone);
    // Zones state contains only currently selected farm's zones, so we also check populated data inside thresholds
    const matchedZone = zones.find(z => z._id === zoneId);
    return matchedZone?.name || 'Unknown';
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2><i className="fas fa-sliders-h"></i> Quản Lý Ngưỡng (Thresholds)</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus"></i> {showForm ? 'Cancel' : 'Add Threshold'}
        </button>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
          <strong>Debug:</strong> Farms count: {farms.length}, Zones count: {zones.length}, Sensor types: {sensorTypes.length}
        </div>
      )}

      {showForm && (
        <form className="form-section" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Threshold' : 'New Threshold'}</h3>
          
          {/* Basic Information */}
          <div className="form-row">
            <input
              type="text"
              placeholder="Threshold Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Farm & Zone Selection */}
          <div className="form-row">
            <select
              value={formData.farmId}
              onChange={(e) => {
                setFormData({ ...formData, farmId: e.target.value, zoneId: '' });
                setSelectedFarm(e.target.value);
              }}
              required
            >
              <option value="">Select Farm</option>
              {farms.map(farm => (
                <option key={farm._id} value={farm._id}>{farm.name}</option>
              ))}
            </select>

            <select
              value={formData.zoneId}
              onChange={(e) => {
                const newZone = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  zoneId: newZone,
                  action: {
                    ...prev.action,
                    actuator: ''
                  }
                }));
              }}
              required
              disabled={!selectedFarm}
            >
              <option value="">Select Zone</option>
              {zones.map(zone => (
                <option key={zone._id} value={zone._id}>{zone.name}</option>
              ))}
            </select>
          </div>

          {/* Sensor Type & Values */}
          <div className="form-row">
            <select
              value={formData.sensorType}
              onChange={(e) => setFormData({ ...formData, sensorType: e.target.value })}
              required
            >
              <option value="">Select Sensor Type</option>
              {sensorTypes.map(type => (
                <option key={type._id} value={type._id}>{type.displayName}</option>
              ))}
            </select>

            <input
              type="number"
              step="0.1"
              placeholder="Min Value"
              value={formData.minValue}
              onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
              required
            />

            <input
              type="number"
              step="0.1"
              placeholder="Max Value"
              value={formData.maxValue}
              onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
              required
            />
          </div>

          {/* Action Configuration */}
          <div className="form-section-title">Action Configuration</div>
          
          <div className="form-row">
            <select
              value={formData.action.type}
              onChange={(e) => setFormData({ 
                ...formData, 
                action: { ...formData.action, type: e.target.value } 
              })}
              required
            >
              <option value="alert">Alert Only</option>
              <option value="device">Device Control Only</option>
              <option value="both">Alert + Device Control</option>
            </select>

            <select
              value={formData.action.priority}
              onChange={(e) => setFormData({ 
                ...formData, 
                action: { ...formData.action, priority: e.target.value } 
              })}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Device Action (if type is 'device' or 'both') */}
          {(formData.action.type === 'device' || formData.action.type === 'both') && (
            <div className="form-row">
              <select
                value={formData.action.actuator}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  action: { ...formData.action, actuator: e.target.value } 
                })}
                disabled={!selectedFarm || !formData.zoneId}
              >
                <option value="">Select Actuator</option>
                {availableActuators.map(actuator => (
                  <option key={actuator._id || actuator.deviceId} value={actuator._id || actuator.deviceId}>
                    {actuator.name} ({actuator.deviceId})
                  </option>
                ))}
              </select>

              <select
                value={formData.action.deviceAction}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  action: { ...formData.action, deviceAction: e.target.value } 
                })}
              >
                <option value="on">Turn ON</option>
                <option value="off">Turn OFF</option>
                <option value="toggle">Toggle</option>
              </select>
            </div>
          )}

          {/* Alert Configuration (if type is 'alert' or 'both') */}
          {(formData.action.type === 'alert' || formData.action.type === 'both') && (
            <>
              <div className="form-row">
                <select
                  value={formData.action.alertType}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    action: { ...formData.action, alertType: e.target.value } 
                  })}
                >
                  <option value="email">Email Only</option>
                  <option value="sms">SMS Only</option>
                  <option value="push">Push Notification</option>
                  <option value="all">All Channels</option>
                </select>
              </div>

              <div className="form-row">
                <input
                  type="text"
                  placeholder="Recipients (comma-separated emails/phones)"
                  value={formData.action.recipients}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    action: { ...formData.action, recipients: e.target.value } 
                  })}
                />
              </div>
            </>
          )}

          {/* Active Status */}
          <div className="form-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-save"></i> {editingId ? 'Update' : 'Create'} Threshold
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      )}

      {/* Thresholds List */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Loading thresholds...</div>
        ) : thresholds.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-sliders-h fa-3x"></i>
            <p>No thresholds configured yet</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Create First Threshold
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Farm / Zone</th>
                <th>Sensor Type</th>
                <th>Min Value</th>
                <th>Max Value</th>
                <th>Action Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Violations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map(threshold => (
                <tr key={threshold._id} className={!threshold.isActive ? 'inactive' : ''}>
                  <td><strong>{threshold.name}</strong></td>
                  <td>
                    <div style={{ fontSize: '0.9em' }}>
                      <div>{getFarmName(threshold.farmId)}</div>
                      <div style={{ color: '#666' }}>{getZoneName(threshold.zoneId)}</div>
                    </div>
                  </td>
                  <td>{getSensorTypeName(threshold.sensorType)}</td>
                  <td>{threshold.minValue}</td>
                  <td>{threshold.maxValue}</td>
                  <td>
                    <span className={`badge badge-${threshold.action.type}`}>
                      {threshold.action.type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${threshold.action.priority}`}>
                      {threshold.action.priority}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${threshold.isActive ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => toggleActive(threshold)}
                    >
                      {threshold.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>{threshold.violationCount || 0}</td>
                  <td className="action-buttons">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEdit(threshold)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(threshold._id)}
                      title="Delete"
                    >
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

export default ThresholdManagement;
