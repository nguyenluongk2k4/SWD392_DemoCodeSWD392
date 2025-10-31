import React, { useState } from 'react';
import '../../styles/components/_apiTester.css';

const ApiTester = ({ onLog }) => {
  const [apiResponse, setApiResponse] = useState('Click a test button to see response...');
  const [testing, setTesting] = useState(false);

  const API_BASE = 'http://localhost:3000';

  const testCases = [
    {
      name: 'GET /api/demo/sensor-data',
      description: 'Get all recent sensor data',
      endpoint: '/api/demo/sensor-data'
    },
    {
      name: 'GET /api/demo/sensor-data?sensorId=temp-sensor-01',
      description: 'Get data for specific sensor',
      endpoint: '/api/demo/sensor-data?sensorId=temp-sensor-01'
    },
    {
      name: 'GET /api/users',
      description: 'Get all users',
      endpoint: '/api/users'
    },
    {
      name: 'GET /api/thresholds',
      description: 'Get all thresholds',
      endpoint: '/api/thresholds'
    }
  ];

  const testAPI = async (endpoint) => {
    setTesting(true);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      const data = await response.json();

      const formattedResponse = `Status: ${response.status} ${response.statusText}\n\n${JSON.stringify(data, null, 2)}`;
      setApiResponse(formattedResponse);

      onLog(`API test successful: ${endpoint}`, 'success');
    } catch (error) {
      const errorResponse = `Error: ${error.message}`;
      setApiResponse(errorResponse);
      onLog(`API test failed: ${endpoint} - ${error.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2><i className="fas fa-flask"></i> API Testing</h2>
      </div>
      <div className="card-body">
        <div className="api-tests">
          {testCases.map((testCase, index) => (
            <div key={index} className="api-test-item">
              <h4>{testCase.name}</h4>
              <p>{testCase.description}</p>
              <button
                className="btn btn-outline"
                onClick={() => testAPI(testCase.endpoint)}
                disabled={testing}
              >
                <i className="fas fa-play"></i> Test
              </button>
            </div>
          ))}
        </div>
        <div className="api-response">
          <h4>API Response:</h4>
          <pre id="api-response-content">{apiResponse}</pre>
        </div>
      </div>
    </section>
  );
};

export default ApiTester;