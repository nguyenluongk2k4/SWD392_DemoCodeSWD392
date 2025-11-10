import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Layout from './components/Layout/Layout';
import StatusBar from './components/StatusBar/StatusBar';
import SensorData from './components/SensorData/SensorData';
import ApiTester from './components/ApiTester/ApiTester';
import FarmManagement from './components/Management/FarmManagement';
import ZoneManagement from './components/Management/ZoneManagement';
import SensorManagement from './components/Management/SensorManagement';
import ActuatorManagement from './components/Management/ActuatorManagement';
import ThresholdManagement from './components/Management/ThresholdManagement';
import UserManagement from './components/Management/UserManagement';
import Logs from './components/Logs/Logs';
import API_CONFIG from './config/api.config';
import socketService from './services/socket.service';

function App() {
  const [serverStatus, setServerStatus] = useState('checking');
  const [mqttStatus, setMqttStatus] = useState('checking');
  const [lastUpdate, setLastUpdate] = useState(null);

  const addLog = useCallback((message, type = 'info') => {
    if (window.addLog) {
      window.addLog(message, type);
    }
  }, []);

  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.DEMO_SENSOR_DATA));
      const data = await response.json();

      if (response.ok && data.success) {
        setServerStatus('online');
        setMqttStatus(data.data.mqttConnected ? 'connected' : 'disconnected');
        setLastUpdate(data.data.lastUpdated);
        addLog('Server status checked successfully', 'success');
      } else {
        setServerStatus('offline');
        addLog('Server status check failed', 'error');
      }
    } catch (error) {
      setServerStatus('offline');
      setMqttStatus('disconnected');
      addLog(`Server connection failed: ${error.message}`, 'error');
    }
  }, [addLog]);

  useEffect(() => {
    checkServerStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, [checkServerStatus]);

  useEffect(() => {
    const handleSensorData = (message) => {
      const sensorId = message?.data?.rawPayload?.sensorId || message?.data?.sensor?.sensorId || 'unknown';
      addLog(`Real-time sensor payload received (${sensorId})`, 'info');
      setLastUpdate(message.timestamp);
    };

    const handleSensorProcessed = (message) => {
      const sensorId = message?.data?.sensor?.sensorId || message?.data?.sensorData?.sensorId || 'unknown';
      addLog(`Sensor data processed in real-time (${sensorId})`, 'success');
      setLastUpdate(message.timestamp);
    };

  socketService.getSocket();
  socketService.on('sensor:data', handleSensorData);
  socketService.on('sensor:data:processed', handleSensorProcessed);

    return () => {
      socketService.off('sensor:data', handleSensorData);
      socketService.off('sensor:data:processed', handleSensorProcessed);
    };
  }, [addLog]);

  const handleDataPublished = () => {
    // Refresh sensor data after publishing
    setTimeout(() => {
      checkServerStatus();
    }, 2000);
  };

  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <SensorData onLog={addLog} />;
      case 'farms':
        return <FarmManagement onLog={addLog} />;
      case 'zones':
        return <ZoneManagement onLog={addLog} />;
      case 'sensors':
        return <SensorManagement onLog={addLog} />;
      case 'actuators':
        return <ActuatorManagement onLog={addLog} />;
      case 'thresholds':
        return <ThresholdManagement onLog={addLog} />;
      case 'sensor-logs':
        return <SensorManagement onLog={addLog} />;
      case 'users':
        return <UserManagement onLog={addLog} />;
      default:
        return <SensorData onLog={addLog} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      <StatusBar
        serverStatus={serverStatus}
        mqttStatus={mqttStatus}
        lastUpdate={lastUpdate}
      />

      <div className="page-content">
        {renderContent()}
      </div>

      <Logs />
    </Layout>
  );
}

export default App;
