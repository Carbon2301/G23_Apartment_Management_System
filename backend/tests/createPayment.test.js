const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Payment = require('../models/paymentModel');
const Fee = require('../models/feeModel');
const Household = require('../models/householdModel');
const User = require('../models/userModel');
const { createPayment } = require('../controllers/paymentController');

// Setup test app
const app = express();
app.use(express.json());

// Mock user middleware
app.use((req, res, next) => {
  req.user = { _id: new mongoose.Types.ObjectId() };
  next();
});

app.post('/payments', createPayment);

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(500).json({ message: error.message });
});

let mongod;
let testFee, testHousehold;

describe('Kiểm thử hộp trắng - Chức năng tạo thanh toán', () => {
  
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);

    // Tạo dữ liệu test cần thiết
    testFee = await Fee.create({
      feeCode: 'PHI001',
      name: 'Phí bảo trì',
      amount: 50000,
      feeType: 'mandatory'
    });

    testHousehold = await Household.create({
      apartmentNumber: 'A101',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      area: 50
    });
  });

  // Cleanup sau mỗi test
  afterEach(async () => {
    await Payment.deleteMany({});
  });

  // Đóng database sau khi hoàn thành tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  // TC1: Tạo thanh toán thành công với dữ liệu hợp lệ
  test('TC1: PHI001/A101/50000 - tạo thanh toán thành công', async () => {
    // Arrange: Dữ liệu thanh toán hợp lệ
    const paymentData = {
      fee: testFee._id,
      household: testHousehold._id,
      amount: 50000,
      paymentDate: new Date(),
      status: 'paid'
    };

    // Act: Thực hiện tạo thanh toán
    const response = await request(app)
      .post('/payments')
      .send(paymentData);

    // Assert: Kiểm tra kết quả thành công
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('amount', 50000);
    expect(response.body).toHaveProperty('status', 'paid');
  });

  // TC2: Tạo thanh toán thất bại - fee không tồn tại
  test('TC2: invalidFee/A101/50000 - TB "Fee not found"', async () => {
    // Arrange: Dữ liệu với fee ID không tồn tại
    const invalidFeeId = new mongoose.Types.ObjectId();
    const paymentData = {
      fee: invalidFeeId,
      household: testHousehold._id,
      amount: 50000
    };

    // Act: Thử tạo thanh toán với fee không tồn tại
    const response = await request(app)
      .post('/payments')
      .send(paymentData);

    // Assert: Kiểm tra lỗi fee not found
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Fee not found');
  });

  // TC3: Tạo thanh toán thất bại - household không tồn tại
  test('TC3: PHI001/invalidHousehold/50000 - TB "Household not found"', async () => {
    // Arrange: Dữ liệu với household ID không tồn tại
    const invalidHouseholdId = new mongoose.Types.ObjectId();
    const paymentData = {
      fee: testFee._id,
      household: invalidHouseholdId,
      amount: 50000
    };

    // Act: Thử tạo thanh toán với household không tồn tại
    const response = await request(app)
      .post('/payments')
      .send(paymentData);

    // Assert: Kiểm tra lỗi household not found
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Household not found');
  });

  // TC4: Tạo thanh toán thất bại - cả fee và household đều không tồn tại
  test('TC4: invalidFee/invalidHousehold/50000 - TB "Fee not found"', async () => {
    //Dữ liệu với cả fee và household ID đều không tồn tại
    const invalidFeeId = new mongoose.Types.ObjectId();
    const invalidHouseholdId = new mongoose.Types.ObjectId();
    const paymentData = {
      fee: invalidFeeId,
      household: invalidHouseholdId,
      amount: 50000
    };

    // Act: Thử tạo thanh toán với cả hai ID không tồn tại
    const response = await request(app)
      .post('/payments')
      .send(paymentData);

    // Assert: Kiểm tra lỗi fee not found (được check trước)
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Fee not found');
  });
}); 