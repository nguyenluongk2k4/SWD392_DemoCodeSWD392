import React, { useState, useEffect } from 'react';
import '../../styles/components/_management.css';

const FarmManagement = ({ onLog }) => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    farmId: '',
    name: '',
    description: '',
    location: { latitude: '', longitude: '', address: '' },
    area: ''
  });

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/debug/seed-data`);
      const data = await response.json();
      setFarms(data.data.farms || []);
      onLog('Loaded farms successfully', 'success');
    } catch (error) {
      onLog(`Error loading farms: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // For now, just add to local state
      if (editingId) {
        setFarms(farms.map(f => f._id === editingId ? { ...formData, _id: editingId } : f));
        onLog('Farm updated successfully', 'success');
      } else {
        setFarms([...farms, { ...formData, _id: Date.now().toString() }]);
        onLog('Farm added successfully', 'success');
      }
      resetForm();
    } catch (error) {
      onLog(`Error: ${error.message}`, 'error');
    }
  };

  const handleEdit = (farm) => {
    setFormData(farm);
    setEditingId(farm._id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setFarms(farms.filter(f => f._id !== id));
    onLog('Farm deleted successfully', 'success');
  };

  const resetForm = () => {
    setFormData({
      farmId: '',
      name: '',
      description: '',
      location: { latitude: '', longitude: '', address: '' },
      area: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2><i className="fas fa-seedling"></i> Quản Lí Farms</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus"></i> {showForm ? 'Cancel' : 'Add Farm'}
        </button>
      </div>

      {showForm && (
        <form className="form-section" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Farm ID"
              value={formData.farmId}
              onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Farm Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="form-row">
            <input
              type="number"
              placeholder="Area (hectares)"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.location.address}
              onChange={(e) => setFormData({
                ...formData,
                location: { ...formData.location, address: e.target.value }
              })}
            />
          </div>
          <button type="submit" className="btn btn-success">
            {editingId ? 'Update' : 'Add'} Farm
          </button>
        </form>
      )}

      <div className="table-responsive">
        {loading ? (
          <div className="loading">Loading farms...</div>
        ) : farms.length === 0 ? (
          <div className="loading">No farms found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Farm ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Area</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((farm) => (
                <tr key={farm._id}>
                  <td>{farm.farmId}</td>
                  <td>{farm.name}</td>
                  <td>{farm.description || 'N/A'}</td>
                  <td>{farm.area || 'N/A'}</td>
                  <td>{farm.owner}</td>
                  <td>
                    <button className="btn-small btn-info" onClick={() => handleEdit(farm)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-small btn-danger" onClick={() => handleDelete(farm._id)}>
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

export default FarmManagement;
