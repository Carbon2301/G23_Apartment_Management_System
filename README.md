# 🏢 G23 Apartment Management System

Hệ thống quản lý chung cư BlueMoon - Một ứng dụng web toàn diện để quản lý các hoạt động của chung cư bao gồm quản lý cư dân, hộ gia đình, phí dịch vụ, thanh toán và tiện ích.

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt và chạy dự án](#-cài-đặt-và-chạy-dự-án)
- [Cấu hình](#-cấu-hình)
- [API Documentation](#-api-documentation)
- [Đóng góp](#-đóng-góp)
- [Giấy phép](#-giấy-phép)

## 🎯 Tổng quan

**G23 Apartment Management System** là một hệ thống quản lý chung cư hiện đại được phát triển để giải quyết các vấn đề quản lý phức tạp trong các tòa nhà chung cư. Hệ thống cung cấp giao diện thân thiện và các tính năng toàn diện cho việc quản lý cư dân, thu phí, và các dịch vụ tiện ích.

### 🎨 Demo
- **Frontend URL**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001](http://localhost:5001)

### 👥 Tài khoản mặc định
```
Admin:
- Email: admin
- Password: admin123
```

## ✨ Tính năng chính

### 🏠 Quản lý Hộ gia đình
- Thêm, sửa, xóa thông tin hộ gia đình
- Quản lý thông tin căn hộ (số phòng, diện tích, loại căn hộ)
- Theo dõi trạng thái cư trú

### 👥 Quản lý Cư dân
- Đăng ký thông tin cư dân mới
- Cập nhật thông tin cá nhân
- Quản lý quan hệ gia đình
- Theo dõi tình trạng tạm trú/tạm vắng

### 🚗 Quản lý Phương tiện
- Đăng ký xe ô tô, xe máy
- Quản lý phí gửi xe
- Theo dõi thông tin biển số, loại xe

### 💰 Quản lý Phí và Thanh toán
- **Các loại phí**:
  - Phí quản lý chung cư
  - Phí gửi xe (ô tô, xe máy)
  - Phí vệ sinh
  - Phí theo diện tích căn hộ
  - Phí đóng góp tự nguyện

- **Thanh toán**:
  - Tạo hóa đơn thanh toán
  - Theo dõi trạng thái thanh toán
  - Lịch sử thanh toán chi tiết
  - Báo cáo doanh thu

### 🛠️ Quản lý Tiện ích
- Quản lý các tiện ích chung (thang máy, hồ bơi, gym, v.v.)
- Lập lịch bảo trì
- Theo dõi tình trạng hoạt động

### 📊 Báo cáo và Thống kê
- Dashboard tổng quan
- Báo cáo doanh thu theo tháng/năm
- Thống kê thanh toán
- Biểu đồ trực quan

### 👤 Quản lý Người dùng
- Phân quyền người dùng (Admin, Manager, Accountant, Staff)
- Đăng nhập/đăng xuất an toàn
- Quản lý hồ sơ cá nhân

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM cho MongoDB
- **JWT** - Authentication
- **bcryptjs** - Mã hóa mật khẩu
- **dotenv** - Quản lý biến môi trường
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **React Bootstrap** - UI components
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **React Context** - State management

### Development Tools
- **Nodemon** - Auto-restart server
- **Jest** - Testing framework
- **Docker** - Containerization
- **Vercel** - Deployment platform

## 📁 Cấu trúc dự án

```
G23_Apartment_Management_Systems/
├── backend/                        # Backend API (Node.js + Express)
│   ├── src/                       # Source code chính
│   │   ├── config/               # Cấu hình ứng dụng
│   │   │   ├── index.js         # Cấu hình chung
│   │   │   └── database.js      # Cấu hình database
│   │   ├── utils/               # Utility functions
│   │   └── app.js               # Express app setup
│   ├── controllers/             # Business logic controllers
│   ├── middleware/              # Express middleware
│   ├── models/                  # Database models (Mongoose)
│   ├── routes/                  # API routes
│   ├── services/               # Business logic services
│   ├── scripts/                # Database scripts
│   │   ├── setup/              # Scripts setup database
│   │   ├── seed/               # Scripts seed data
│   │   ├── maintenance/        # Scripts bảo trì
│   │   └── setupAll.js         # Script chạy tất cả setup
│   ├── tests/                  # Test files
│   ├── .env                   # Environment variables
│   ├── package.json
│   ├── server.js              # Entry point
│   └── docker-compose.yml
│
├── frontend/                   # Frontend (React)
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── common/       # Common reusable components
│   │   │   ├── layout/       # Layout components
│   │   │   └── features/     # Feature-specific components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   ├── context/          # React Context
│   │   ├── utils/            # Utility functions
│   │   ├── assets/           # Images, fonts, etc.
│   │   ├── styles/           # Global styles
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── docs/                      # Documentation
└── README.md                  # Tài liệu này
```

## 💻 Yêu cầu hệ thống

### Phần mềm cần thiết
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0 hoặc **yarn** >= 1.22.0
- **Docker Desktop** 
- **Git** >= 2.30.0

### Hệ điều hành hỗ trợ
- Windows 10/11
- macOS 10.15+
- Ubuntu 18.04+

## 🚀 Cài đặt và chạy dự án

### 1. Clone dự án

```bash
git clone https://github.com/your-username/G23_Apartment_Management_Systems.git
cd G23_Apartment_Management_Systems
```
### 2. Cài đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Cài đặt docker
docker compose
```
Chuyển qua terminal mới:
```bash
cd backend
docker-compose up 
```

#### Khởi tạo database với dữ liệu mẫu:
```bash
# Chạy tất cả scripts setup (tạo database, seed data)
cd backend 
node createAdminUser.js
npm run setup
```

#### Chạy backend server:
```bash
# Development mode (auto-restart)
cd backend
npm run dev

# Production mode
cd backend
npm start
```

Backend sẽ chạy tại: `http://localhost:5001`

### 4. Cài đặt Frontend

Mở terminal mới:

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Chạy frontend
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

### 5. Truy cập ứng dụng

1. Mở trình duyệt và truy cập: `http://localhost:3000`
2. Đăng nhập bằng tài khoản admin:
   - Email: `admin`
   - Password: `admin123`

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/users/login          # Đăng nhập
POST /api/users/register       # Đăng ký (admin only)
GET  /api/users/profile        # Lấy thông tin profile
PUT  /api/users/profile        # Cập nhật profile
```

### Household Management
```
GET    /api/households         # Lấy danh sách hộ gia đình
POST   /api/households         # Tạo hộ gia đình mới
GET    /api/households/:id     # Lấy chi tiết hộ gia đình
PUT    /api/households/:id     # Cập nhật hộ gia đình
DELETE /api/households/:id     # Xóa hộ gia đình
```

### Resident Management
```
GET    /api/residents          # Lấy danh sách cư dân
POST   /api/residents          # Thêm cư dân mới
GET    /api/residents/:id      # Lấy chi tiết cư dân
PUT    /api/residents/:id      # Cập nhật cư dân
DELETE /api/residents/:id      # Xóa cư dân
```

### Payment Management
```
GET    /api/payments           # Lấy danh sách thanh toán
POST   /api/payments           # Tạo thanh toán mới
GET    /api/payments/:id       # Lấy chi tiết thanh toán
PUT    /api/payments/:id       # Cập nhật thanh toán
DELETE /api/payments/:id       # Xóa thanh toán
GET    /api/payments/search    # Tìm kiếm thanh toán
```

### Fee Management
```
GET    /api/fees               # Lấy danh sách phí
POST   /api/fees               # Tạo phí mới
GET    /api/fees/:id           # Lấy chi tiết phí
PUT    /api/fees/:id           # Cập nhật phí
DELETE /api/fees/:id           # Xóa phí
```

### Statistics
```
GET    /api/statistics/dashboard    # Dashboard data
GET    /api/statistics/revenue      # Báo cáo doanh thu
GET    /api/statistics/payments     # Thống kê thanh toán
```

## 🧪 Testing

### Chạy tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Test coverage
npm run test:coverage
```

### Test Scripts có sẵn

```bash
# Test database connection
cd backend
node scripts/maintenance/paymentStats.js

# Test API endpoints
npm run test:api

# Test components
cd frontend
npm run test:components
```

<!-- ## 🚀 Deployment

### Deploy lên Vercel

1. **Chuẩn bị**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   vercel --prod
   ```

3. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Cấu hình Environment Variables** trên Vercel dashboard

### Deploy lên Heroku

1. **Backend**:
   ```bash
   cd backend
   heroku create your-app-backend
   heroku config:set MONGO_URI=your-mongodb-uri
   git push heroku main
   ```

2. **Frontend**:
   ```bash
   cd frontend
   heroku create your-app-frontend
   heroku config:set REACT_APP_API_URL=your-backend-url
   git push heroku main
   ``` -->

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết.

### Quy trình đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

### Coding Standards

- Sử dụng ESLint và Prettier
- Viết tests cho features mới
- Tuân thủ conventional commits
- Cập nhật documentation

## 📝 Changelog

### Version 1.0.0 (2025-06-15)
- ✨ Tính năng quản lý hộ gia đình và cư dân
- ✨ Hệ thống thanh toán và quản lý phí
- ✨ Dashboard và báo cáo thống kê
- ✨ Quản lý phương tiện và tiện ích
- ✨ Hệ thống phân quyền người dùng
- 🐛 Sửa lỗi và tối ưu hiệu suất

## 📄 Giấy phép

Dự án này được phân phối dưới giấy phép MIT. 

---

**Made with ❤️ by G23 Team** 
