import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/_logs.css';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Function to add log (will be passed to parent)
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now(),
      timestamp,
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Function to clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Expose functions to parent component
  useEffect(() => {
    window.addLog = addLog;
    window.clearLogs = clearLogs;
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <h2><i className="fas fa-terminal"></i> Activity Logs</h2>
        <button className="btn btn-outline" onClick={clearLogs}>
          <i className="fas fa-trash"></i> Clear
        </button>
      </div>
      <div className="card-body">
        <div className="logs-container">
          {logs.length === 0 ? (
            <div className="log-entry">Client initialized...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                [{log.timestamp}] {log.message}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </section>
  );
};

export default Logs;