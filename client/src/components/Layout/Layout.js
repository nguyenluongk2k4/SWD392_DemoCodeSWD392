import React, { useState, useEffect } from 'react';
import '../../styles/components/_layout.css';

const Layout = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'farms', label: 'Quản Lí Farms', icon: 'fas fa-seedling' },
    { id: 'zones', label: 'Quản Lí Zones', icon: 'fas fa-map' },
    { id: 'sensors', label: 'Quản Lí Sensors', icon: 'fas fa-microchip' },
    { id: 'actuators', label: 'Quản Lí Actuators', icon: 'fas fa-sliders-h' },
    { id: 'users', label: 'Quản Lí Người Dùng', icon: 'fas fa-users-cog' },
    { id: 'thresholds', label: 'Quản Lí Ngưỡng', icon: 'fas fa-signal' },
    { id: 'sensor-logs', label: 'Sensor Logs', icon: 'fas fa-history' }
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="fas fa-bars"></i>
          </button>
          {sidebarOpen && <h1 className="app-title">Smart Agri</h1>}
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onPageChange(item.id)}
              title={!sidebarOpen ? item.label : ''}
            >
              <i className={item.icon}></i>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
