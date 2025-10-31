// import React, { useState } from 'react';
// import '../styles/components/_publishForm.css';

// const PublishForm = ({ onLog, onDataPublished }) => {
//   const [formData, setFormData] = useState({
//     sensorId: 'temp-sensor-01',
//     sensorType: 'temperature',
//     value: '',
//     farmZone: 'zone-1'
//   });
//   const [publishing, setPublishing] = useState(false);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.value || isNaN(formData.value)) {
//       onLog('Please enter a valid sensor value', 'error');
//       return;
//     }

//     setPublishing(true);

//     try {
//       const publishData = {
//         ...formData,
//         value: parseFloat(formData.value),
//         timestamp: new Date().toISOString()
//       };

//       // For demo purposes, simulate publishing to MQTT
//       // In a real implementation, this would call a backend endpoint
//       onLog(`Publishing sensor data: ${publishData.sensorId} = ${publishData.value}`, 'success');

//       // Simulate API call delay
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       onLog('Sensor data published successfully (simulated)', 'success');
//       onDataPublished();

//     } catch (error) {
//       onLog(`Failed to publish sensor data: ${error.message}`, 'error');
//     } finally {
//       setPublishing(false);
//     }
//   };

//   const generateRandomData = () => {
//     const sensors = [
//       { id: 'temp-sensor-01', type: 'temperature', min: 20, max: 40 },
//       { id: 'moisture-sensor-01', type: 'soil-moisture', min: 10, max: 90 },
//       { id: 'light-sensor-01', type: 'light', min: 100, max: 1000 },
//       { id: 'humidity-sensor-01', type: 'humidity', min: 30, max: 90 }
//     ];

//     const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];
//     const randomValue = Math.round((Math.random() * (randomSensor.max - randomSensor.min) + randomSensor.min) * 10) / 10;

//     setFormData(prev => ({
//       ...prev,
//       sensorId: randomSensor.id,
//       sensorType: randomSensor.type,
//       value: randomValue.toString()
//     }));

//     onLog(`Generated random data: ${randomSensor.id} = ${randomValue}`, 'success');
//   };

//   return (
//     <section className="card">
//       <div className="card-header">
//         <h2><i className="fas fa-paper-plane"></i> Publish Sensor Data</h2>
//       </div>
//       <div className="card-body">
//         <form className="publish-form" onSubmit={handleSubmit}>
//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="sensor-id">Sensor ID:</label>
//               <select
//                 id="sensor-id"
//                 name="sensorId"
//                 className="form-control"
//                 value={formData.sensorId}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="temp-sensor-01">Temperature Sensor 01</option>
//                 <option value="moisture-sensor-01">Moisture Sensor 01</option>
//                 <option value="light-sensor-01">Light Sensor 01</option>
//                 <option value="humidity-sensor-01">Humidity Sensor 01</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="sensor-type">Sensor Type:</label>
//               <select
//                 id="sensor-type"
//                 name="sensorType"
//                 className="form-control"
//                 value={formData.sensorType}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="temperature">Temperature</option>
//                 <option value="soil-moisture">Soil Moisture</option>
//                 <option value="light">Light</option>
//                 <option value="humidity">Humidity</option>
//               </select>
//             </div>
//           </div>
//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="sensor-value">Value:</label>
//               <input
//                 type="number"
//                 id="sensor-value"
//                 name="value"
//                 className="form-control"
//                 step="0.1"
//                 value={formData.value}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="farm-zone">Farm Zone:</label>
//               <select
//                 id="farm-zone"
//                 name="farmZone"
//                 className="form-control"
//                 value={formData.farmZone}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="zone-1">Zone 1</option>
//                 <option value="zone-2">Zone 2</option>
//                 <option value="zone-3">Zone 3</option>
//               </select>
//             </div>
//           </div>
//           <div className="form-actions">
//             <button type="submit" className="btn btn-success" disabled={publishing}>
//               <i className="fas fa-paper-plane"></i>
//               {publishing ? 'Publishing...' : 'Publish to MQTT'}
//             </button>
//             <button type="button" className="btn btn-secondary" onClick={generateRandomData}>
//               <i className="fas fa-random"></i> Generate Random Data
//             </button>
//           </div>
//         </form>
//       </div>
//     </section>
//   );
// };

// export default PublishForm;