import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/components/_management.css';
import API_CONFIG from '../../config/api.config';

const DEFAULT_FORM = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: '',
  isActive: true,
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Ngưng hoạt động' },
];

const DEFAULT_ROLE_OPTIONS = [
  { _id: 'admin', name: 'admin', description: 'Quản trị hệ thống' },
  { _id: 'manager', name: 'manager', description: 'Quản lý vận hành' },
  { _id: 'operator', name: 'operator', description: 'Nhân viên vận hành' },
  { _id: 'viewer', name: 'viewer', description: 'Người xem báo cáo' },
];

const UserManagement = ({ onLog }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  const roleMap = useMemo(() => {
    const map = new Map();
    roles.forEach((role) => {
      map.set(role._id, role);
      map.set(role.name, role);
    });
    return map;
  }, [roles]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchRoles(), fetchUsers()]);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROLES));
      const data = await response.json();
      if (data.success) {
        const payload = data.data || [];
        if (payload.length === 0) {
          onLog?.('Không tìm thấy vai trò trong hệ thống, dùng danh sách mẫu', 'info');
          setRoles(DEFAULT_ROLE_OPTIONS);
        } else {
          setRoles(payload);
        }
      } else {
        onLog?.('Không thể tải danh sách vai trò, dùng dữ liệu mẫu', 'warning');
        setRoles(DEFAULT_ROLE_OPTIONS);
      }
    } catch (error) {
      setRoles(DEFAULT_ROLE_OPTIONS);
      onLog?.(`Lỗi tải vai trò: ${error.message}. Đang dùng danh sách vai trò mẫu`, 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USERS));
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        setUsers([]);
        onLog?.('Không thể tải danh sách người dùng', 'warning');
      }
    } catch (error) {
      setUsers([]);
      onLog?.(`Lỗi tải người dùng: ${error.message}`, 'error');
    }
  };

  const resolveRoleName = (roleValue) => {
    if (!roleValue) return 'Không xác định';
    if (typeof roleValue === 'object') {
      return roleValue.description || roleValue.displayName || roleValue.name || 'Không xác định';
    }
    const match = roleMap.get(roleValue);
    if (!match) return roleValue;
    return match.description || match.displayName || match.name || roleValue;
  };

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesKeyword =
        !keyword ||
        user.username?.toLowerCase().includes(keyword) ||
        user.fullName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        resolveRoleName(user.role).toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      return matchesKeyword && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setFormData(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setFormData({
      username: user.username || '',
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      phoneNumber: user.phoneNumber || '',
      role: user.role?._id || user.role,
      isActive: user.isActive ?? true,
    });
    setEditingId(user._id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(DEFAULT_FORM);
    setEditingId(null);
    setSaving(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber ? formData.phoneNumber.trim() : undefined,
      role: formData.role,
      isActive: formData.isActive,
    };

    if (!editingId) {
      payload.username = formData.username.trim();
      payload.password = formData.password;
    } else if (formData.password) {
      payload.password = formData.password;
    }

    if (!payload.role) {
      onLog?.('Vui lòng chọn vai trò cho người dùng', 'warning');
      return;
    }

    if (!editingId && !payload.password) {
      onLog?.('Vui lòng nhập mật khẩu cho người dùng mới', 'warning');
      return;
    }

    setSaving(true);

    try {
      const endpoint = editingId
        ? API_CONFIG.getUserUrl(editingId)
        : API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USERS);
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Không thể lưu người dùng');
      }

      if (editingId) {
        setUsers((prev) => prev.map((user) => (user._id === editingId ? result.data : user)));
        onLog?.('Cập nhật người dùng thành công', 'success');
      } else {
        setUsers((prev) => [...prev, result.data]);
        onLog?.('Tạo người dùng mới thành công', 'success');
      }

      closeForm();
    } catch (error) {
      onLog?.(`Lỗi lưu người dùng: ${error.message}`, 'error');
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
      const response = await fetch(API_CONFIG.getUserUrl(userId), { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Không thể xóa người dùng');
      }
      setUsers((prev) => prev.filter((user) => user._id !== userId));
      onLog?.('Đã xóa người dùng', 'success');
    } catch (error) {
      onLog?.(`Lỗi xóa người dùng: ${error.message}`, 'error');
    }
  };

  const toggleActive = async (user) => {
    try {
      const response = await fetch(API_CONFIG.getUserUrl(user._id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Không thể thay đổi trạng thái người dùng');
      }
      setUsers((prev) => prev.map((item) => (item._id === user._id ? result.data : item)));
      onLog?.(`Đã ${user.isActive ? 'vô hiệu hóa' : 'kích hoạt'} người dùng`, 'success');
    } catch (error) {
      onLog?.(`Lỗi thay đổi trạng thái: ${error.message}`, 'error');
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2>
          <i className="fas fa-users-cog" /> Quản Lý Người Dùng
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => (showForm ? closeForm() : openCreateForm())}>
            <i className="fas fa-plus" /> {showForm ? 'Đóng Form' : 'Thêm Người Dùng'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="form-section" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Chỉnh sửa người dùng' : 'Người dùng mới'}</h3>

          <div className="form-row">
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={formData.username}
              onChange={(event) => setFormData({ ...formData, username: event.target.value })}
              required={!editingId}
              disabled={!!editingId}
            />
            <input
              type="text"
              placeholder="Họ và tên"
              value={formData.fullName}
              onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Số điện thoại (10-15 chữ số)"
              value={formData.phoneNumber}
              onChange={(event) => setFormData({ ...formData, phoneNumber: event.target.value })}
            />
          </div>

          <div className="form-row">
            <select
              value={formData.role}
              onChange={(event) => setFormData({ ...formData, role: event.target.value })}
              required
            >
              <option value="">Chọn vai trò</option>
              {roles.map((role) => {
                const value = role._id || role.name;
                return (
                  <option key={value} value={value}>
                    {role.description || role.name}
                  </option>
                );
              })}
            </select>
            <input
              type="password"
              placeholder={editingId ? 'Đổi mật khẩu (tùy chọn)' : 'Mật khẩu'}
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              required={!editingId}
            />
          </div>

  <div className="form-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
              />
              <span>Kích hoạt người dùng</span>
            </label>
          </div>

          <div>
            <button type="submit" className="btn btn-success" disabled={saving}>
              <i className="fas fa-save" /> {saving ? 'Đang lưu...' : 'Lưu người dùng'}
            </button>
            <button type="button" className="btn btn-danger" style={{ marginLeft: '10px' }} onClick={closeForm}>
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="loading">Không có người dùng phù hợp</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Đăng nhập gần nhất</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{resolveRoleName(user.role)}</td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button className="btn btn-info btn-small" onClick={() => openEditForm(user)}>
                      <i className="fas fa-edit" /> Sửa
                    </button>
                    <button className="btn btn-small btn-success" onClick={() => toggleActive(user)}>
                      <i className="fas fa-power-off" /> {user.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                    </button>
                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(user._id)}>
                      <i className="fas fa-trash" /> Xóa
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

export default UserManagement;

