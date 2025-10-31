# Smart Agriculture System - React Client

Client React application để test và tương tác với Smart Agriculture System API.

## 🚀 Cài đặt và Chạy

### Điều kiện cần có
- Node.js (version 14+)
- Backend server đang chạy trên `http://localhost:3000`

### Cài đặt dependencies
```bash
cd client
npm install
```

### Chạy development server
```bash
npm start
```
Ứng dụng sẽ chạy trên `http://localhost:3000` (cùng port với backend)

## 📋 Tính năng

### 1. **Status Bar** - Theo dõi trạng thái hệ thống
- Server Status: Online/Offline
- MQTT Status: Connected/Disconnected
- Last Update: Thời gian cập nhật cuối

### 2. **Sensor Data** - Xem dữ liệu sensor
- Hiển thị tất cả sensor data gần đây
- Lọc theo sensor ID cụ thể
- Refresh data real-time
- Grid layout responsive

### 3. **Publish Sensor Data** - Gửi dữ liệu sensor
- Form nhập liệu với validation
- Chọn sensor type và zone
- Generate random data
- Simulate MQTT publish

### 4. **API Testing** - Test các API endpoints
- GET /api/demo/sensor-data
- GET /api/demo/sensor-data?sensorId=...
- GET /api/users
- GET /api/thresholds
- Hiển thị response JSON

### 5. **Activity Logs** - Logs hoạt động
- Real-time logging
- Color-coded log types (success, error, warning)
- Auto-scroll to bottom
- Clear logs button

## 🏗️ Kiến trúc Component

```
src/
├── components/
│   ├── StatusBar.js/css     # Component hiển thị trạng thái
│   ├── SensorData.js/css    # Component xem sensor data
│   ├── PublishForm.js/css   # Component publish data
│   ├── ApiTester.js/css     # Component test API
│   └── Logs.js/css          # Component logs
├── App.js                   # Component chính
├── App.css                  # Global styles
└── index.js                 # Entry point
```

## 🔧 API Endpoints được sử dụng

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/demo/sensor-data` | Lấy tất cả sensor data |
| GET | `/api/demo/sensor-data?sensorId={id}` | Lấy data theo sensor |
| GET | `/api/users` | Lấy danh sách users |
| GET | `/api/thresholds` | Lấy danh sách thresholds |

## 🎨 Styling

- **CSS Variables**: Sử dụng CSS custom properties cho theme
- **Responsive Design**: Mobile-first approach
- **Animations**: Smooth transitions và fade-in effects
- **Font Awesome**: Icons cho UI elements

## 🔄 State Management

- **Local State**: useState cho component state
- **Props**: Communication giữa parent-child components
- **Callbacks**: Event handling từ child to parent

## 🚀 Deployment

### Build production
```bash
npm run build
```

### Serve static files
```bash
npm install -g serve
serve -s build
```

## 🐛 Troubleshooting

### CORS Issues
Nếu gặp lỗi CORS, đảm bảo backend có cấu hình CORS middleware:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Port Conflict
Nếu port 3000 bị conflict với backend:
1. Thay đổi port trong `package.json`:
```json
"scripts": {
  "start": "PORT=3001 react-scripts start"
}
```

2. Hoặc sử dụng proxy trong `package.json`:
```json
"proxy": "http://localhost:3000"
```

## 📱 Mobile Support

- Responsive grid layout
- Touch-friendly buttons
- Optimized for mobile browsers
- PWA ready (có thể extend thêm)

## 🔮 Future Enhancements

- [ ] WebSocket real-time updates
- [ ] Chart.js cho visualization
- [ ] Authentication với JWT
- [ ] Dark mode toggle
- [ ] Export data to CSV/Excel
- [ ] Push notifications

## 📝 License

MIT License - Tự do sử dụng cho mục đích học tập và phát triển.

---

**Built with React.js** | **Smart Agriculture System** | **2025**

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
