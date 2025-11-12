import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/components/_alerts.css';
import API_CONFIG from '../../config/api.config';
import socketService from '../../services/socket.service';

const SOCKET_EVENTS = {
  created: 'alert:created',
  notified: 'alert:notified',
  updated: 'alert:updated',
  acknowledged: 'alert:acknowledged',
  resolved: 'alert:resolved',
};

const severityOrder = ['critical', 'high', 'medium', 'low'];

const resolveAlertPayload = (message) => {
  if (!message) return null;
  if (message.alert) return message.alert;
  if (message.data?.alert) return message.data.alert;
  return message.data || null;
};

const AlertCenter = ({ onLog }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ severity: 'all', status: 'all', search: '' });
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ALERTS_ACTIVE));
      const payload = await response.json();
      if (payload.success) {
        const list = Array.isArray(payload.data) ? payload.data : [];
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAlerts(list);
        onLog?.(`Loaded ${list.length} active alerts`, 'info');
      } else {
        throw new Error(payload.message || 'Failed to load alerts');
      }
    } catch (err) {
      const message = err.message || 'Unable to load alerts';
      setError(message);
      onLog?.(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [onLog]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const upsertAlert = useCallback((incoming) => {
    if (!incoming || !incoming._id) return;
    setAlerts((current) => {
      const index = current.findIndex((item) => item._id === incoming._id);
      if (index === -1) {
        return [incoming, ...current].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      const next = [...current];
      next[index] = { ...next[index], ...incoming };
      return next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }, []);

  useEffect(() => {
    const handleEvent = (message) => {
      const alert = resolveAlertPayload(message?.data || message);
      if (!alert) return;
      upsertAlert(alert);
    };

    socketService.on(SOCKET_EVENTS.created, handleEvent);
    socketService.on(SOCKET_EVENTS.updated, handleEvent);
    socketService.on(SOCKET_EVENTS.acknowledged, handleEvent);
    socketService.on(SOCKET_EVENTS.resolved, handleEvent);

    const handleNotified = (message) => {
      const alert = resolveAlertPayload(message?.data || message);
      if (!alert) return;
      upsertAlert(alert);
      onLog?.(`Alert ${alert.title || alert._id} sent via notification channel`, 'success');
    };

    socketService.on(SOCKET_EVENTS.notified, handleNotified);

    return () => {
      socketService.off(SOCKET_EVENTS.created, handleEvent);
      socketService.off(SOCKET_EVENTS.updated, handleEvent);
      socketService.off(SOCKET_EVENTS.acknowledged, handleEvent);
      socketService.off(SOCKET_EVENTS.resolved, handleEvent);
      socketService.off(SOCKET_EVENTS.notified, handleNotified);
    };
  }, [onLog, upsertAlert]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const severityMatch = filters.severity === 'all' || alert.severity === filters.severity;
      const statusMatch = filters.status === 'all' || alert.status === filters.status;
      const searchMatch = filters.search.trim().length === 0
        || alert.title?.toLowerCase().includes(filters.search.toLowerCase())
        || alert.message?.toLowerCase().includes(filters.search.toLowerCase())
        || alert.threshold?.thresholdName?.toLowerCase().includes(filters.search.toLowerCase());
      return severityMatch && statusMatch && searchMatch;
    });
  }, [alerts, filters]);

  const sortAlerts = useCallback((list) => {
    return [...list].sort((a, b) => {
      const severityDif = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
      if (severityDif !== 0) return severityDif;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, []);

  const visibleAlerts = useMemo(() => sortAlerts(filteredAlerts), [filteredAlerts, sortAlerts]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const acknowledgeAlert = async (alertId) => {
    if (!alertId) return;
    setIsAcknowledging(true);
    try {
      const response = await fetch(`${API_CONFIG.getAlertUrl(alertId)}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const payload = await response.json();
      if (payload.success) {
        upsertAlert(payload.data);
        onLog?.('Alert acknowledged', 'success');
      } else {
        throw new Error(payload.message || 'Failed to acknowledge alert');
      }
    } catch (err) {
      onLog?.(err.message || 'Failed to acknowledge alert', 'error');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const resolveAlert = async (alertId) => {
    if (!alertId) return;
    const notes = window.prompt('Enter resolution notes (optional):') || '';
    setIsResolving(true);
    try {
      const response = await fetch(`${API_CONFIG.getAlertUrl(alertId)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      const payload = await response.json();
      if (payload.success) {
        upsertAlert(payload.data);
        onLog?.('Alert resolved', 'success');
      } else {
        throw new Error(payload.message || 'Failed to resolve alert');
      }
    } catch (err) {
      onLog?.(err.message || 'Failed to resolve alert', 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const renderHistory = (history = []) => {
    if (!history.length) {
      return <div className="alert-history-empty">No history yet</div>;
    }

    return (
      <ul className="alert-history">
        {history
          .slice()
          .reverse()
          .slice(0, 5)
          .map((entry, index) => (
            <li key={`${entry.createdAt}-${index}`}>
              <span className="history-status">{entry.event}</span>
              <span className="history-detail">{entry.detail || entry.status}</span>
              <span className="history-date">{new Date(entry.createdAt).toLocaleString()}</span>
            </li>
          ))}
      </ul>
    );
  };

  return (
    <section className="card alert-center">
      <div className="card-header">
        <div>
          <h2><i className="fas fa-exclamation-triangle"></i> Alerts Center</h2>
          <p className="subtitle">Monitoring, acknowledging, and resolving alerts in real-time</p>
        </div>
        <div className="actions">
          <button className="btn btn-outline" onClick={loadAlerts} disabled={loading}>
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>
      </div>

      <div className="alert-filters">
        <div className="filter-group">
          <label htmlFor="severity-filter">Severity</label>
          <select
            id="severity-filter"
            value={filters.severity}
            onChange={(e) => updateFilter('severity', e.target.value)}
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="notified">Notified</option>
            <option value="notification_failed">Notification Failed</option>
            <option value="action_executed">Action Executed</option>
            <option value="action_failed">Action Failed</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        <div className="filter-group search">
          <label htmlFor="search-filter">Search</label>
          <input
            id="search-filter"
            type="text"
            placeholder="Search title, message, threshold..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="alert-grid">
        {loading && alerts.length === 0 ? (
          <div className="alert-empty">Loading alerts...</div>
        ) : visibleAlerts.length === 0 ? (
          <div className="alert-empty">No alerts found</div>
        ) : (
          visibleAlerts.map((alert) => (
            <article key={alert._id} className={`alert-card severity-${alert.severity}`}>
              <header>
                <div>
                  <h3>{alert.title}</h3>
                  <span className={`severity-badge severity-${alert.severity}`}>{alert.severity}</span>
                  <span className={`status-badge status-${alert.status}`}>{alert.status}</span>
                </div>
                <time>{new Date(alert.createdAt).toLocaleString()}</time>
              </header>

              <p className="alert-message">{alert.message}</p>

              <div className="alert-meta">
                {alert.threshold?.thresholdName && (
                  <div>
                    <strong>Threshold:</strong> {alert.threshold.thresholdName}
                  </div>
                )}
                {alert.sensorData?.value !== undefined && (
                  <div>
                    <strong>Sensor Value:</strong> {alert.sensorData.value}
                  </div>
                )}
                {alert.automation?.requestedAction && (
                  <div>
                    <strong>Automation Action:</strong> {alert.automation.requestedAction}
                  </div>
                )}
                {alert.notifications?.length > 0 && (
                  <div>
                    <strong>Notifications:</strong> {alert.notifications.map((n) => `${n.channel}:${n.status}`).join(', ')}
                  </div>
                )}
              </div>

              <div className="alert-history-wrapper">
                <h4>Recent Activity</h4>
                {renderHistory(alert.history)}
              </div>

              <footer className="alert-actions">
                <button
                  className="btn btn-outline"
                  disabled={isAcknowledging || ['acknowledged', 'resolved', 'dismissed'].includes(alert.status)}
                  onClick={() => acknowledgeAlert(alert._id)}
                >
                  {isAcknowledging ? 'Working...' : <><i className="fas fa-check-circle"></i> Acknowledge</>}
                </button>
                <button
                  className="btn btn-primary"
                  disabled={isResolving || ['resolved', 'dismissed'].includes(alert.status)}
                  onClick={() => resolveAlert(alert._id)}
                >
                  {isResolving ? 'Working...' : <><i className="fas fa-clipboard-check"></i> Resolve</>}
                </button>
              </footer>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default AlertCenter;
