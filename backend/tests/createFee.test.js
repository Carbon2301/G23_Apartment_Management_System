const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Fee = require('../models/feeModel');
const { createFee } = require('../controllers/feeController');

// Setup test app
const app = express();
app.use(express.json());
app.post('/fees', createFee);

let mongod;

describe('Kiểm thử hộp trắng - Chức năng tạo khoản thu', () => {
  
  // Setup database trước khi chạy tests
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
  });

  // Cleanup sau mỗi test
  afterEach(async () => {
    await Fee.deleteMany({});
  });

  // Đóng database sau khi hoàn thành tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  // TC1: Tạo khoản thu thành công với dữ liệu hợp lệ
  test('TC1: Tạo phí bảo vệ thành công', async () => {
    // Arrange: Dữ liệu phí hợp lệ
    const feeData = {
      feeCode: 'PHI001',
      name: 'Phí bảo trì',
      description: 'Phí dịch vụ bảo trì hàng tháng',
      amount: 50000,
      feeType: 'mandatory',
      startDate: '2024-01-01'
    };

    // Act: Thực hiện tạo khoản thu
    const response = await request(app)
      .post('/fees')
      .send(feeData);

    // Assert: Kiểm tra kết quả thành công
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('feeCode', 'PHI001');
    expect(response.body).toHaveProperty('name', 'Phí bảo trì');
    expect(response.body).toHaveProperty('amount', 50000);
    expect(response.body).toHaveProperty('feeType', 'mandatory');
    expect(response.body).toHaveProperty('active', true);
  });

  // TC2: Tạo khoản thu thất bại - mã phí đã tồn tại
  test('TC2: Tạo phí với mã PHI001 đã tồn tại - TB "Phí với mã PHI001 đã tồn tại"', async () => {
    // Arrange: Tạo phí với mã PHI001 trước
    await Fee.create({
      feeCode: 'PHI001',
      name: 'Phí bảo trì cũ',
      amount: 40000,
      feeType: 'mandatory'
    });

    // Dữ liệu phí mới với cùng mã
    const duplicateFeeData = {
      feeCode: 'PHI001', // Mã trùng lặp
      name: 'Phí bảo trì mới',
      amount: 50000,
      feeType: 'mandatory'
    };

    // Act: Thử tạo phí với mã đã tồn tại
    const response = await request(app)
      .post('/fees')
      .send(duplicateFeeData);

    // Assert: Kiểm tra lỗi mã phí đã tồn tại
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'A fee with this code already exists');
  });

  // TC3: Tạo khoản thu thất bại - thiếu trường bắt buộc
  test('TC3: Tạo phí thiếu trường bắt buộc - TB "Phí thiếu trường bắt buộc"', async () => {
    // Arrange: Dữ liệu thiếu trường name (bắt buộc)
    const incompleteFeeData = {
      feeCode: 'PHI002',
      // name: 'Phí vệ sinh', // Thiếu trường bắt buộc
      amount: 30000,
      feeType: 'mandatory'
    };

    // Act: Thử tạo phí với dữ liệu không đầy đủ
    const response = await request(app)
      .post('/fees')
      .send(incompleteFeeData);

    // Assert: Kiểm tra lỗi validation
    expect(response.status).toBe(500); // MongoDB validation error sẽ throw exception
    expect(response.body).toHaveProperty('message', 'Server Error');
  });

  // TC4: Tạo khoản thu thất bại - số tiền âm
  test('TC4: Tạo phí với số tiền âm - TB "Phí với số tiền âm"', async () => {
    // Arrange: Dữ liệu với số tiền không hợp lệ
    const invalidAmountFeeData = {
      feeCode: 'PHI003',
      name: 'Phí điện nước',
      amount: -10000, // Số tiền âm (không hợp lệ)
      feeType: 'utilities'
    };

    // Act: Thử tạo phí với số tiền âm
    const response = await request(app)
      .post('/fees')
      .send(invalidAmountFeeData);

    // Assert: Kiểm tra lỗi validation số tiền
    expect(response.status).toBe(500); // MongoDB validation error
    expect(response.body).toHaveProperty('message', 'Server Error');
  });

  // TC5: Tạo khoản thu với các trường optional
  test('TC5: Tạo phí đầy đủ thông tin - TB "Tạo phí thành công"', async () => {
    // Arrange: Dữ liệu phí đầy đủ
    const completeFeeData = {
      feeCode: 'PHI004',
      name: 'Phí đóng góp Tết',
      description: 'Phí đóng góp tổ chức Tết Nguyên Đán',
      amount: 200000,
      feeType: 'voluntary',
      startDate: '2024-01-01',
      endDate: '2024-02-29'
    };

    // Act: Tạo phí với đầy đủ thông tin
    const response = await request(app)
      .post('/fees')
      .send(completeFeeData);

    // Assert: Kiểm tra tạo thành công với đầy đủ thông tin
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('feeCode', 'PHI004');
    expect(response.body).toHaveProperty('name', 'Phí đóng góp Tết');
    expect(response.body).toHaveProperty('description', 'Phí đóng góp tổ chức Tết Nguyên Đán');
    expect(response.body).toHaveProperty('amount', 200000);
    expect(response.body).toHaveProperty('feeType', 'voluntary');
    expect(response.body).toHaveProperty('endDate');
  });
});
