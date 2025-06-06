# Kiểm Thử Hộp Trắng - Chức Năng Tạo Khoản Thu

## Mục Tiêu
Kiểm thử tất cả các đường dẫn mã trong hàm `createFee` của `feeController.js`

## Test Cases

| TC | Dữ liệu | Expected Outcome | Kết quả | Đường dẫn kiểm thử |
|----|---------|------------------|---------|-------------------|
| 1 | PHI001/Phí bảo vệ/50000 | Tạo thành công, status 201 | ✅ Passed | **Path 2+3** - Success path |
| 2 | PHI001 (đã tồn tại) | TB "A fee with this code already exists" | ✅ Passed | **Path 1** - Duplicate check |
| 3 | Thiếu trường name | TB "Server Error" (validation) | ✅ Passed | **Path 4** - Validation error |
| 4 | amount = -10000 | TB "Server Error" (validation) | ✅ Passed | **Path 4** - Amount validation |
| 5 | Đầy đủ thông tin + endDate | Tạo thành công với đầy đủ field | ✅ Passed | **Path 2+3** - Complete data |

### Tỷ lệ bao phủ: 100% (4/4 paths chính)

## Cách Chạy Test

```bash
# Chạy test cụ thể
npx jest tests/createFee.test.js

# Chạy với verbose output
npx jest tests/createFee.test.js --verbose
```
