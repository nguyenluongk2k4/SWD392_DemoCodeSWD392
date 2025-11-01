import React, { useState, useEffect } from 'react';
import '../../styles/components/_management.css';

const ZoneManagement = ({ onLog }) => {
  const [zones, setZones] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    zoneId: '',
    name: '',
    description: '',
    farmId: '',
    cropType: '',
    area: ''
  });

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/debug/seed-data`);
      const data = await response.json();
      setZones(data.data.zones || []);
      setFarms(data.data.farms || []);
      onLog('Loaded zones successfully', 'success');
    } catch (error) {
      onLog(`Error loading zones: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        setZones(zones.map(z => z._id === editingId ? { ...formData, _id: editingId } : z));
        onLog('Zone updated successfully', 'success');
      } else {
        setZones([...zones, { ...formData, _id: Date.now().toString() }]);
        onLog('Zone added successfully', 'success');
      }
      resetForm();
    } catch (error) {
      onLog(`Error: ${error.message}`, 'error');
    }
  };

  const handleEdit = (zone) => {
    setFormData(zone);
    setEditingId(zone._id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setZones(zones.filter(z => z._id !== id));
    onLog('Zone deleted successfully', 'success');
  };

  const resetForm = () => {
    setFormData({
      zoneId: '',
      name: '',
      description: '',
      farmId: '',
      cropType: '',
      area: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2><i className="fas fa-map"></i> Quản Lí Zones</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus"></i> {showForm ? 'Cancel' : 'Add Zone'}
        </button>
      </div>

      {showForm && (
        <form className="form-section" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Zone ID"
              value={formData.zoneId}
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Zone Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <select
              value={formData.farmId}
              onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
              required
            >
              <option value="">Select Farm</option>
              {farms.map(farm => (
                <option key={farm._id} value={farm._id}>{farm.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Crop Type"
              value={formData.cropType}
              onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <button type="submit" className="btn btn-success">
            {editingId ? 'Update' : 'Add'} Zone
          </button>
        </form>
      )}

      <div className="table-responsive">
        {loading ? (
          <div className="loading">Loading zones...</div>
        ) : zones.length === 0 ? (
          <div className="loading">No zones found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Zone ID</th>
                <th>Name</th>
                <th>Farm</th>
                <th>Crop Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone._id}>
                  <td>{zone.zoneId}</td>
                  <td>{zone.name}</td>
                  <td>{zone.farm}</td>
                  <td>{zone.cropType || 'N/A'}</td>
                  <td>
                    <button className="btn-small btn-info" onClick={() => handleEdit(zone)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-small btn-danger" onClick={() => handleDelete(zone._id)}>
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

export default ZoneManagement;
