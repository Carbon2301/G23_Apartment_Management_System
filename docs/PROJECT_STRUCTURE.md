# Cấu trúc dự án G23 Apartment Management System

## Tổng quan
Dự án được tổ chức theo mô hình monorepo với backend và frontend tách biệt, tuân theo các best practices của Node.js và React.

## Cấu trúc thư mục

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
│   ├── scripts/                # Database scripts và utilities
│   │   ├── setup/              # Scripts setup database
│   │   │   ├── clearDatabase.js
│   │   │   └── setupDatabase.js
│   │   ├── seed/               # Scripts seed data
│   │   │   ├── seedFacilities.js
│   │   │   ├── setHouseholdHeads.js
│   │   │   ├── addAreaBasedFees.js
│   │   │   ├── addAreaBasedPayments.js
│   │   │   ├── addMoreAreaPayments.js
│   │   │   ├── createHygieneFee.js
│   │   │   └── addTempStatusToResidents.js
│   │   ├── maintenance/        # Scripts bảo trì
│   │   │   ├── updateVehicleFee.js
│   │   │   ├── updateVoluntaryFeeStatus.js
│   │   │   ├── restoreOriginalFees.js
│   │   │   ├── fixPaymentDates.js
│   │   │   └── paymentStats.js
│   │   └── setupAll.js         # Script chạy tất cả setup
│   ├── tests/                  # Test files
│   │   ├── unit/              # Unit tests
│   │   └── integration/       # Integration tests
│   ├── .env                   # Environment variables
│   ├── package.json
│   ├── server.js              # Entry point
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/                   # Frontend (React)
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── common/       # Common reusable components
│   │   │   │   ├── Logo.js
│   │   │   │   ├── Loader.js
│   │   │   │   ├── Message.js
│   │   │   │   ├── FormContainer.js
│   │   │   │   ├── ConfirmDeleteModal.js
│   │   │   │   ├── PrivateRoute.js
│   │   │   │   └── RoleRoute.js
│   │   │   ├── layout/       # Layout components
│   │   │   │   ├── Header.js
│   │   │   │   └── Footer.js
│   │   │   └── features/     # Feature-specific components
│   │   ├── pages/            # Page components (formerly screens)
│   │   │   ├── LoginScreen.js
│   │   │   ├── DashboardScreen.js
│   │   │   ├── HouseholdListScreen.js
│   │   │   └── ... (tất cả các screens khác)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services và config
│   │   │   └── config.js
│   │   ├── context/          # React Context
│   │   ├── utils/            # Utility functions
│   │   ├── assets/           # Images, fonts, etc.
│   │   ├── styles/           # Global styles
│   │   │   ├── index.css
│   │   │   └── custom-theme.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── docs/                      # Documentation
│   ├── api/                  # API documentation
│   ├── setup/                # Setup guides
│   └── PROJECT_STRUCTURE.md  # Tài liệu này
│
├── .gitignore
├── README.md
└── package.json              # Root package.json
```

## Lợi ích của cấu trúc mới

### Backend
1. **Tách biệt concerns**: Config, app setup, và server entry point được tách riêng
2. **Scripts được tổ chức**: Chia thành setup, seed, và maintenance
3. **Dễ bảo trì**: Cấu trúc rõ ràng, dễ tìm và sửa code
4. **Scalable**: Dễ thêm features mới

### Frontend
1. **Component organization**: Chia thành common, layout, và features
2. **Pages thay vì screens**: Naming convention chuẩn hơn
3. **Styles tập trung**: Tất cả CSS ở một nơi
4. **Services tách biệt**: API calls và config riêng biệt

## Cách sử dụng

### Setup dự án
```bash
# Chạy tất cả setup scripts
cd backend
npm run setup
```

### Development
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

## Migration Notes

### Import paths đã thay đổi:
- `./components/Header` → `./components/layout/Header`
- `./components/Logo` → `./components/common/Logo`
- `./screens/LoginScreen` → `./pages/LoginScreen`
- `./index.css` → `./styles/index.css`

### Scripts paths:
- `scripts/setupDatabase.js` → `scripts/setup/setupDatabase.js`
- `scripts/seedFacilities.js` → `scripts/seed/seedFacilities.js`
- `scripts/updateVehicleFee.js` → `scripts/maintenance/updateVehicleFee.js`

## Best Practices

1. **Naming conventions**: 
   - Components: PascalCase
   - Files: camelCase hoặc kebab-case
   - Directories: lowercase

2. **Import organization**:
   - Third-party imports trước
   - Local imports sau
   - Relative imports cuối

3. **File organization**:
   - Một component per file
   - Index files cho re-exports
   - Consistent naming

4. **Testing**:
   - Unit tests trong `tests/unit/`
   - Integration tests trong `tests/integration/`
   - Test files cùng tên với file được test 