# Database Scripts

Thư mục này chứa các scripts để quản lý database và dữ liệu của hệ thống quản lý chung cư.

## Cấu trúc

### setup/
Scripts để thiết lập database ban đầu:
- `clearDatabase.js` - Xóa toàn bộ dữ liệu
- `setupDatabase.js` - Tạo cấu trúc database và dữ liệu mẫu

### seed/
Scripts để thêm dữ liệu mẫu:
- `seedFacilities.js` - Thêm dữ liệu tiện ích
- `setHouseholdHeads.js` - Thiết lập chủ hộ
- `addAreaBasedFees.js` - Thêm phí theo diện tích
- `addAreaBasedPayments.js` - Thêm thanh toán theo diện tích
- `addMoreAreaPayments.js` - Thêm thêm thanh toán
- `createHygieneFee.js` - Tạo phí vệ sinh
- `addTempStatusToResidents.js` - Thêm trạng thái tạm trú

### maintenance/
Scripts để bảo trì và cập nhật dữ liệu:
- `updateVehicleFee.js` - Cập nhật phí xe
- `updateVoluntaryFeeStatus.js` - Cập nhật trạng thái phí tự nguyện
- `restoreOriginalFees.js` - Khôi phục phí gốc
- `fixPaymentDates.js` - Sửa ngày thanh toán
- `paymentStats.js` - Thống kê thanh toán

## Cách sử dụng

### Chạy tất cả setup scripts
```bash
npm run setup
```

### Chạy script riêng lẻ
```bash
# Setup scripts
node scripts/setup/clearDatabase.js
node scripts/setup/setupDatabase.js

# Seed scripts
node scripts/seed/seedFacilities.js
node scripts/seed/setHouseholdHeads.js

# Maintenance scripts
node scripts/maintenance/updateVehicleFee.js
node scripts/maintenance/paymentStats.js
```

## Yêu cầu

- Node.js
- MongoDB đang chạy
- File `.env` với cấu hình database
- Các dependencies đã được cài đặt (`npm install`)

## Biến môi trường

Đảm bảo file `.env` có các biến sau:
```
MONGO_URI=mongodb://localhost:27017/bluemoon_apartment
MONGODB_URI=mongodb://localhost:27017/bluemoon_apartment
```

## Lưu ý

- Luôn backup database trước khi chạy scripts maintenance
- Scripts setup sẽ xóa dữ liệu hiện tại
- Chạy scripts theo thứ tự đúng để tránh lỗi dependency 