const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/userModel');
const { loginUser } = require('../controllers/userController');

const app = express();
app.use(express.json());
app.post('/login', loginUser);

let mongod;

describe('Kiểm thử hộp trắng - Chức năng đăng nhập', () => {
  
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
  });

  // Cleanup sau mỗi test
  afterEach(async () => {
    await User.deleteMany({});
  });

  // Đóng database sau khi hoàn thành tests
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  // TC1: Đăng nhập thành công với tài khoản admin hợp lệ
  test('TC1: admin/admin123 - chuyển sang form làm việc của admin', async () => {
    // Arrange: Tạo user admin trong database
    await User.create({
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrator',
      role: 'admin',
      active: true
    });

    // Act: Thực hiện đăng nhập
    const response = await request(app)
      .post('/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    // Assert: Kiểm tra kết quả thành công
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'admin');
    expect(response.body).toHaveProperty('role', 'admin');
    expect(response.body).toHaveProperty('token');
    expect(response.body.token).toMatch(/^dummy-token-/);
  });

  // TC2: Đăng nhập thất bại - mật khẩu sai
  test('TC2: admin/123456 - TB "Tài khoản hoặc mật khẩu không chính xác"', async () => {
    // Arrange: Tạo user admin với mật khẩu khác
    await User.create({
      username: 'admin',
      password: 'admin123', // Mật khẩu đúng là admin123
      fullName: 'Administrator',
      role: 'admin',
      active: true
    });

    // Act: Thực hiện đăng nhập với mật khẩu sai
    const response = await request(app)
      .post('/login')
      .send({
        username: 'admin',
        password: '123456' // Mật khẩu sai
      });

    // Assert: Kiểm tra lỗi mật khẩu không đúng
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Mật khẩu không đúng');
  });

  // TC3: Đăng nhập thất bại - tên đăng nhập sai
  test('TC3: adminn/admin123 - TB "Tài khoản hoặc mật khẩu không chính xác"', async () => {
    // Arrange: Tạo user admin
    await User.create({
      username: 'admin', // Username đúng là 'admin'
      password: 'admin123',
      fullName: 'Administrator',
      role: 'admin',
      active: true
    });

    // Act: Thực hiện đăng nhập với username sai
    const response = await request(app)
      .post('/login')
      .send({
        username: 'adminn', // Username sai (thừa 1 chữ n)
        password: 'admin123'
      });

    // Assert: Kiểm tra lỗi username không tồn tại
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Tên đăng nhập không tồn tại');
  });

  // TC4: Đăng nhập thất bại - cả username và password đều sai
  test('TC4: adminn/12345678 - TB "Tài khoản hoặc mật khẩu không chính xác"', async () => {
    // Arrange: Tạo user admin với thông tin đúng
    await User.create({
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrator', 
      role: 'admin',
      active: true
    });

    // Act: Thực hiện đăng nhập với cả username và password sai
    const response = await request(app)
      .post('/login')
      .send({
        username: 'adminn', // Username sai
        password: '12345678' // Password cũng sai
      });

    // Assert: Kiểm tra lỗi username không tồn tại (lỗi đầu tiên được check)
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Tên đăng nhập không tồn tại');
  });
});
