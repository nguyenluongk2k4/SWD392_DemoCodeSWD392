import React from 'react';
import '../../styles/components/_statusBar.css';

const StatusBar = ({ serverStatus, mqttStatus, lastUpdate }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'status-online';
      case 'offline':
      case 'disconnected':
        return 'status-offline';
      default:
        return 'status-checking';
    }
  };

  const formatStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Checking...';
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-label">Server Status:</span>
        <span className={`status-value ${getStatusClass(serverStatus)}`}>
          {formatStatusText(serverStatus)}
        </span>
      </div>
      <div className="status-item">
        <span className="status-label">MQTT Status:</span>
        <span className={`status-value ${getStatusClass(mqttStatus)}`}>
          {formatStatusText(mqttStatus)}
        </span>
      </div>
      <div className="status-item">
        <span className="status-label">Last Update:</span>
        <span className={`status-value ${getStatusClass('online')}`}>
          {formatLastUpdate(lastUpdate)}
        </span>
      </div>
    </div>
  );
};

export default StatusBar;