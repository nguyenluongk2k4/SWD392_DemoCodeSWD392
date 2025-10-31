import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import StatusBar from './components/StatusBar';
import SensorData from './components/SensorData';
import PublishForm from './components/PublishForm';
import ApiTester from './components/ApiTester';
import Logs from './components/Logs';

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
      const response = await fetch('http://localhost:3000/api/demo/sensor-data');
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

  const handleDataPublished = () => {
    // Refresh sensor data after publishing
    setTimeout(() => {
      checkServerStatus();
    }, 2000);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1><i className="fas fa-seedling"></i> Smart Agriculture System</h1>
        <p>Client Dashboard - Test API Endpoints</p>
      </header>

      <main className="App-main">
        <StatusBar
          serverStatus={serverStatus}
          mqttStatus={mqttStatus}
          lastUpdate={lastUpdate}
        />

        <div className="main-content">
          <SensorData onLog={addLog} />
          <PublishForm onLog={addLog} onDataPublished={handleDataPublished} />
          <ApiTester onLog={addLog} />
        </div>

        <Logs />
      </main>
    </div>
  );
}

export default App;
