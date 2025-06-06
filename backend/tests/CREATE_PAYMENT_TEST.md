# Kiểm Thử Hộp Trắng - Chức Năng Tạo Thanh Toán

## Mục Tiêu
Kiểm thử các đường dẫn mã chính trong hàm `createPayment` với 4 test cases đơn giản

## Test Cases

| TC | Dữ liệu đầu vào | Expected Outcome | Đường dẫn kiểm thử |
|----|-----------------|------------------|-------------------|
| 1 | fee+household hợp lệ + amount=50000 | Tạo thành công, status 201 | **Path Success** - Happy path |
| 2 | fee không tồn tại + household hợp lệ | TB error message | **Path Fee Check** - Fee validation |
| 3 | fee hợp lệ + household không tồn tại | TB error message | **Path Household Check** - Household validation |
| 4 | fee+household đều không tồn tại | TB error message (fee check trước) | **Path Fee Check** - Fee validation first |

## Cách Chạy Test

```bash
# Chạy test đơn giản
npx jest tests/createPayment.test.js

# Chạy với verbose output
npx jest tests/createPayment.test.js --verbose
```
