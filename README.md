# SWD392 Express.js Project

Dự án Express.js cơ bản với cấu trúc MVC pattern.

## 📋 Yêu cầu

- Node.js (v14 trở lên)
- npm hoặc yarn

## 🚀 Cài đặt

1. Cài đặt các dependencies:
```bash
npm install
```

2. Tạo file `.env` và cấu hình các biến môi trường (đã có sẵn)

3. Chạy server ở chế độ development:
```bash
npm run dev
```

hoặc chạy ở chế độ production:
```bash
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 📁 Cấu trúc thư mục

```
SWD392/
├── src/
│   ├── controllers/     # Controllers xử lý logic
│   ├── routes/          # Routes định nghĩa endpoints
│   └── index.js         # Entry point
├── .env                 # Biến môi trường
├── .gitignore          
├── package.json
└── README.md
```

## 🛣️ API Endpoints

### Health Check
- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint

### Users
- `GET /api/users` - Lấy danh sách tất cả users
- `GET /api/users/:id` - Lấy user theo ID
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

## 📝 Ví dụ sử dụng

### Tạo user mới
```bash
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "name": "Nguyen Van C",
  "email": "vanc@example.com"
}
```

### Lấy danh sách users
```bash
GET http://localhost:3000/api/users
```

## 🔧 Technologies

- **Express.js** - Web framework
- **dotenv** - Environment variables
- **cors** - Cross-Origin Resource Sharing
- **nodemon** - Auto-restart server (dev)

## 📄 License

ISC
