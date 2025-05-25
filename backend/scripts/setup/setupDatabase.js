const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Household = require('../../models/householdModel');
const Resident = require('../../models/residentModel');
const Payment = require('../../models/paymentModel');
const Fee = require('../../models/feeModel');
const User = require('../../models/userModel');
const Vehicle = require('../../models/vehicleModel');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment')
  .then(async () => {
    console.log('🔌 Đã kết nối đến MongoDB');
    
    try {
      // Bước 1: Kiểm tra và xóa chỉ mục householdCode nếu tồn tại
      await fixHouseholdIndex();
      
      // Bước 2: Cập nhật mô hình thanh toán để hỗ trợ trường period
      await updatePaymentModel();
      
      // Bước 3: Tạo người dùng admin nếu chưa có
      await createAdminUser();
      
      // Bước 4: Tạo dữ liệu mẫu
      await createMassiveTestData();
      
      console.log('\n✅ Hoàn thành quá trình thiết lập dữ liệu!');
    } catch (error) {
      console.error('❌ Lỗi trong quá trình thiết lập dữ liệu:', error);
    } finally {
      await mongoose.connection.close();
      console.log('🔌 Đã đóng kết nối MongoDB');
    }
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối đến MongoDB:', err);
    process.exit(1);
  });

// Hàm kiểm tra và xóa chỉ mục householdCode
async function fixHouseholdIndex() {
  console.log('\n🔍 Đang kiểm tra chỉ mục householdCode...');
  
  try {
    // Lấy collection households
    const db = mongoose.connection.db;
    
    // Kiểm tra xem collection households có tồn tại không
    const collections = await db.listCollections().toArray();
    const householdsExists = collections.some(col => col.name === 'households');
    
    if (householdsExists) {
      // Kiểm tra các chỉ mục hiện có
      const indexes = await db.collection('households').indexes();
      
      // Tìm chỉ mục householdCode
      const householdCodeIndex = indexes.find(index => 
        index.name === 'householdCode_1' || 
        (index.key && Object.keys(index.key).includes('householdCode'))
      );
      
      if (householdCodeIndex) {
        console.log('🗑️ Tìm thấy chỉ mục householdCode, đang xóa...');
        await db.command({
          dropIndexes: 'households',
          index: householdCodeIndex.name
        });
        console.log('✅ Đã xóa chỉ mục householdCode thành công!');
      } else {
        console.log('✅ Không tìm thấy chỉ mục householdCode, tiếp tục...');
      }
    } else {
      console.log('ℹ️ Collection households chưa tồn tại, bỏ qua bước này.');
    }
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra/xóa chỉ mục:', error);
  }
}

// Hàm cập nhật mô hình thanh toán để hỗ trợ trường period
async function updatePaymentModel() {
  console.log('\n🔄 Đang cập nhật mô hình thanh toán...');
  
  try {
    // Lấy collection payments
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'payments' }).toArray();
    
    if (collections.length > 0) {
      console.log('🔍 Đang kiểm tra và cập nhật chỉ mục cho collection payments...');
      
      // Kiểm tra các chỉ mục hiện có
      const indexes = await db.collection('payments').indexes();
      
      // Tìm chỉ mục cũ (fee_household)
      const oldIndex = indexes.find(index => 
        index.name === 'fee_1_household_1' || 
        (index.key && index.key.fee === 1 && index.key.household === 1 && !index.key.period)
      );
      
      if (oldIndex) {
        console.log('🗑️ Tìm thấy chỉ mục cũ fee_household, đang xóa...');
        await db.collection('payments').dropIndex(oldIndex.name);
        console.log('✅ Đã xóa chỉ mục cũ thành công!');
      }
      
      // Tạo chỉ mục mới bao gồm trường period
      console.log('🔧 Đang tạo chỉ mục mới fee_household_period...');
      await db.collection('payments').createIndex(
        { fee: 1, household: 1, period: 1 }, 
        { unique: true }
      );
      console.log('✅ Đã tạo chỉ mục mới thành công!');
      
      // Cập nhật các bản ghi hiện có để thêm trường period nếu chưa có
      console.log('🔄 Đang cập nhật các bản ghi thanh toán hiện có...');
      const result = await db.collection('payments').updateMany(
        { period: { $exists: false } },
        [{ 
          $set: { 
            period: { 
              $cond: {
                if: { $eq: ["$paymentDate", null] },
                then: null,
                else: { 
                  $dateFromParts: { 
                    year: { $year: "$paymentDate" }, 
                    month: { $month: "$paymentDate" }, 
                    day: 1 
                  } 
                }
              }
            } 
          } 
        }]
      );
      
      console.log(`✅ Đã cập nhật ${result.modifiedCount} bản ghi thanh toán với trường period`);
    } else {
      console.log('ℹ️ Collection payments chưa tồn tại, bỏ qua bước này.');
    }
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật mô hình thanh toán:', error);
  }
}

// Hàm tạo người dùng admin
async function createAdminUser() {
  console.log('\n👤 Đang kiểm tra người dùng admin...');
  
  try {
    // Kiểm tra xem đã có admin chưa
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('✅ Người dùng admin đã tồn tại:', adminExists.email);
      return;
    }
    
    // Tạo người dùng admin mới
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@bluemoon.com',
      password: 'admin123',
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Đã tạo người dùng admin mới:', adminUser.email);
    
    // Tạo thêm một số người dùng khác
    const users = [
      {
        name: 'Quản lý',
        email: 'manager@bluemoon.com',
        password: 'manager123',
        role: 'manager'
      },
      {
        name: 'Kế toán',
        email: 'accountant@bluemoon.com',
        password: 'accountant123',
        role: 'accountant'
      },
      {
        name: 'Nhân viên',
        email: 'staff@bluemoon.com',
        password: 'staff123',
        role: 'staff'
      }
    ];
    
    for (const user of users) {
      const userExists = await User.findOne({ email: user.email });
      if (!userExists) {
        const newUser = new User(user);
        await newUser.save();
        console.log(`✅ Đã tạo người dùng ${user.role}:`, user.email);
      }
    }
  } catch (error) {
    console.error('❌ Lỗi khi tạo người dùng admin:', error);
    throw error;
  }
}

// Hàm tạo dữ liệu mẫu
async function createMassiveTestData() {
  console.log('\n🚀 Bắt đầu tạo dữ liệu test...');

  try {
    // Tạo loại phí nếu chưa có
    await createFees();
    
    // Tạo 50 hộ gia đình mới
    console.log('📋 Tạo hộ gia đình...');
    const householdsToCreate = [];
    
    // Tạo 50 hộ gia đình từ tầng 1-10, mỗi tầng 5 căn hộ
    for (let floor = 1; floor <= 10; floor++) {
      for (let unit = 1; unit <= 5; unit++) {
        const apartmentNumber = `${String.fromCharCode(64 + floor)}${unit.toString().padStart(2, '0')}`;
        
        const creationDate = new Date();
        creationDate.setFullYear(creationDate.getFullYear() - 1);
        
        householdsToCreate.push({
          apartmentNumber: apartmentNumber,
          address: `Căn hộ ${apartmentNumber}, Chung cư BlueMoon, Quận ${Math.floor(Math.random() * 12) + 1}, TP.HCM`,
          area: Math.floor(Math.random() * 100) + 30, // Diện tích từ 30-129 m²
          note: `Hộ gia đình ${apartmentNumber} - Ngày tạo: ${creationDate.toLocaleDateString('vi-VN')}`,
          creationDate: creationDate,
          active: true
        });
      }
    }

    // Xóa hộ gia đình cũ (trừ 3 hộ đầu tiên)
    await Household.deleteMany({ 
      apartmentNumber: { $not: { $in: ['A101', 'B202', 'C303'] } } 
    });

    const households = await Household.insertMany(householdsToCreate);
    console.log(`✅ Đã tạo ${households.length} hộ gia đình mới`);

    // Lấy tất cả hộ gia đình (bao gồm cũ và mới)
    const allHouseholds = await Household.find({ active: true });
    console.log(`📊 Tổng số hộ gia đình: ${allHouseholds.length}`);

    // Tạo cư dân cho mỗi hộ gia đình
    console.log('👥 Tạo cư dân...');
    const residentsToCreate = [];
    
    for (const household of allHouseholds) {
      // Mỗi hộ gia đình có 2-5 cư dân
      const numResidents = Math.floor(Math.random() * 4) + 2;
      const relationships = ['Chủ hộ', 'Vợ/Chồng', 'Con', 'Con', 'Cha/Mẹ'];
      
      for (let i = 0; i < numResidents; i++) {
        const isMale = Math.random() > 0.5;
        const age = Math.floor(Math.random() * 60) + 20;
        const names = isMale 
          ? ['Nguyễn Văn', 'Trần Văn', 'Lê Văn', 'Phạm Văn', 'Hoàng Văn', 'Huỳnh Văn', 'Phan Văn', 'Vũ Văn']
          : ['Nguyễn Thị', 'Trần Thị', 'Lê Thị', 'Phạm Thị', 'Hoàng Thị', 'Huỳnh Thị', 'Phan Thị', 'Vũ Thị'];
        const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Khoa', 'Long', 'Nam', 'Quang', 'Tuấn', 'Việt', 'Xuân'];
        
        const fullName = `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        
        residentsToCreate.push({
          household: household._id,
          fullName: fullName,
          dateOfBirth: new Date(new Date().getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: isMale ? 'male' : 'female',
          nationalId: `${Math.floor(Math.random() * 900000000) + 100000000}${Math.floor(Math.random() * 100)}`,
          phone: `09${Math.floor(Math.random() * 90000000) + 10000000}`,
          email: `${fullName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')}@email.com`,
          relationshipToOwner: relationships[i] || 'Khác',
          moveInDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          active: true
        });
      }
    }

    // Xóa cư dân cũ (trừ những cư dân của 3 hộ đầu tiên)
    const oldHouseholdIds = (await Household.find({ 
      apartmentNumber: { $in: ['A101', 'B202', 'C303'] } 
    })).map(h => h._id);
    
    await Resident.deleteMany({ 
      household: { $not: { $in: oldHouseholdIds } } 
    });

    const residents = await Resident.insertMany(residentsToCreate);
    console.log(`✅ Đã tạo ${residents.length} cư dân mới`);

    // Lấy tất cả cư dân
    const allResidents = await Resident.find({ active: true });
    console.log(`📊 Tổng số cư dân: ${allResidents.length}`);

    // Tạo thanh toán cho 6 tháng gần nhất
    console.log('💰 Tạo thanh toán...');
    const fees = await Fee.find({ active: true });
    const paymentsToCreate = [];

    // Tạo thanh toán cho 6 tháng gần nhất
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const paymentMonth = new Date();
      paymentMonth.setMonth(paymentMonth.getMonth() - monthOffset);
      
      console.log(`📅 Tạo thanh toán cho tháng ${paymentMonth.getMonth() + 1}/${paymentMonth.getFullYear()}`);
      
      // Tỷ lệ thanh toán khác nhau cho từng tháng
      let paymentRate;
      if (monthOffset === 1) {
        // Tháng 5 (tháng trước): chỉ 50-60% hộ gia đình thanh toán để tạo nhiều khoản nợ
        paymentRate = 0.5 + Math.random() * 0.1;
      } else if (monthOffset === 0) {
        // Tháng 6 (tháng hiện tại): 70-80% hộ gia đình thanh toán
        paymentRate = 0.7 + Math.random() * 0.1;
      } else {
        // Các tháng trước đó: 80-95% hộ gia đình thanh toán
        paymentRate = 0.8 + Math.random() * 0.15;
      }
      
      // Chọn ngẫu nhiên hộ gia đình thanh toán theo tỷ lệ
      const payingHouseholds = allHouseholds
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(allHouseholds.length * paymentRate));
      
      for (const household of payingHouseholds) {
        // Mỗi hộ thanh toán 3-7 loại phí ngẫu nhiên
        const numPayments = Math.floor(Math.random() * 5) + 3;
        const selectedFees = fees.sort(() => 0.5 - Math.random()).slice(0, numPayments);
        
        for (const fee of selectedFees) {
          // Tạo ngày thanh toán ngẫu nhiên trong tháng
          let paymentDate;
          
          // Nếu là tháng hiện tại, đảm bảo ngày thanh toán <= 6 (nếu tháng hiện tại là tháng 6)
          if (monthOffset === 0 && paymentMonth.getMonth() === 5) { // Tháng 6 (index 5)
            paymentDate = new Date(
              paymentMonth.getFullYear(), 
              paymentMonth.getMonth(), 
              Math.floor(Math.random() * 6) + 1 // Ngày 1-6
            );
          } else {
            paymentDate = new Date(
              paymentMonth.getFullYear(), 
              paymentMonth.getMonth(), 
              Math.floor(Math.random() * 28) + 1
            );
          }

          // Tạo period (ngày 1 của tháng)
          const period = new Date(
            paymentMonth.getFullYear(),
            paymentMonth.getMonth(),
            1
          );

          // Tạo số tiền với biến động ±30%
          const baseAmount = fee.amount || 500000;
          const variance = 0.7 + Math.random() * 0.6; // 0.7 - 1.3
          const amount = Math.floor((baseAmount * variance) / 10000) * 10000;

          // Tạo status cho thanh toán
          let status;
          if (monthOffset === 1) {
            // Tháng 5 (tháng trước): 90% đã thanh toán, 10% quá hạn
            status = Math.random() < 0.9 ? 'paid' : 'overdue';
          } else if (monthOffset === 0) {
            // Tháng 6 (tháng hiện tại): 90% đã thanh toán, 10% đang chờ
            status = Math.random() < 0.9 ? 'paid' : 'pending';
          } else {
            // Các tháng trước: 90% đã thanh toán, 10% quá hạn
            status = Math.random() < 0.9 ? 'paid' : 'overdue';
          }

          paymentsToCreate.push({
            household: household._id,
            fee: fee._id,
            amount: amount,
            paymentDate: paymentDate,
            period: period,
            method: ['cash', 'bank_transfer', 'card', 'other'][Math.floor(Math.random() * 4)],
            status: status,
            note: ''
          });
        }
      }

      // Đối với các hộ gia đình không nằm trong danh sách thanh toán, tạo các khoản nợ
      if (monthOffset === 1) { // Chỉ tạo nợ cho tháng 5 (tháng trước)
        const nonPayingHouseholds = allHouseholds.filter(
          h => !payingHouseholds.some(ph => ph._id.toString() === h._id.toString())
        );
        
        // Đảm bảo có ít nhất 20% hộ gia đình có nợ phí quản lý hàng tháng
        const managementFee = fees.find(fee => fee.name === 'Phí quản lý hàng tháng' || fee.feeCode === 'PHI001');
        
        if (managementFee) {
          const overdueHouseholds = nonPayingHouseholds.slice(0, Math.max(5, Math.floor(allHouseholds.length * 0.2)));
          
          for (const household of overdueHouseholds) {
            // Tạo khoản nợ phí quản lý
            paymentsToCreate.push({
              household: household._id,
              fee: managementFee._id,
              amount: managementFee.amount,
              paymentDate: null, // Không có ngày thanh toán vì chưa thanh toán
              period: new Date(new Date().getFullYear(), 4, 1), // Tháng 5 (index 4)
              method: null,
              status: 'overdue', // Quá hạn
              note: `Phí quản lý hàng tháng quá hạn - Tháng 5/${new Date().getFullYear()}`
            });
            
            // Thêm 1-2 khoản nợ khác
            const otherFees = fees.filter(f => f._id.toString() !== managementFee._id.toString())
              .sort(() => 0.5 - Math.random())
              .slice(0, 1 + Math.floor(Math.random() * 2));
            
            for (const fee of otherFees) {
              paymentsToCreate.push({
                household: household._id,
                fee: fee._id,
                amount: fee.amount,
                paymentDate: null,
                period: new Date(new Date().getFullYear(), 4, 1), // Tháng 5 (index 4)
                method: null,
                status: 'overdue',
                note: `${fee.name} quá hạn - Tháng 5/${new Date().getFullYear()}`
              });
            }
          }
        }
      }
    }

    // Thêm dữ liệu thanh toán cụ thể cho tháng 6 đến ngày 6/6
    console.log('💰 Thêm dữ liệu thanh toán cụ thể cho tháng 6 đến ngày 6/6...');
    
    // Đảm bảo mọi hộ gia đình đều có thanh toán phí quản lý hàng tháng
    const managementFee = fees.find(fee => fee.name === 'Phí quản lý hàng tháng' || fee.feeCode === 'PHI001');
    
    if (managementFee) {
      for (const household of allHouseholds) {
        // Kiểm tra xem hộ gia đình đã có thanh toán phí quản lý tháng 6 chưa
        const existingPayment = paymentsToCreate.find(p => 
          p.household.toString() === household._id.toString() && 
          p.fee.toString() === managementFee._id.toString() &&
          p.paymentDate && // Đảm bảo có ngày thanh toán
          p.paymentDate.getMonth() === 5 && // Tháng 6 (index 5)
          p.paymentDate.getFullYear() === new Date().getFullYear()
        );
        
        if (!existingPayment) {
          // Thêm thanh toán phí quản lý cho tháng 6
          paymentsToCreate.push({
            household: household._id,
            fee: managementFee._id,
            amount: managementFee.amount,
            paymentDate: new Date(new Date().getFullYear(), 5, Math.floor(Math.random() * 6) + 1), // Ngày 1-6 tháng 6
            period: new Date(new Date().getFullYear(), 5, 1),
            method: ['cash', 'bank_transfer'][Math.floor(Math.random() * 2)],
            status: 'paid', // Chỉ có trạng thái đã thanh toán hoặc đang chờ
            note: `Thanh toán phí quản lý hàng tháng - Tháng 6/${new Date().getFullYear()}`
          });
        }
      }
    }
    
    // Tạo tình huống đặc biệt: Hộ gia đình đã thanh toán tháng 6 nhưng còn nợ tháng 5
    // Đây là tình huống cần thiết để test chức năng "Thanh toán nợ"
    console.log('💰 Tạo tình huống đặc biệt: Hộ đã thanh toán tháng 6 nhưng còn nợ tháng 5...');
    
    // Chọn 30% hộ gia đình để tạo tình huống đặc biệt này
    const specialCaseHouseholds = allHouseholds
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(allHouseholds.length * 0.3));
    
    for (const household of specialCaseHouseholds) {
      // Đảm bảo hộ này đã thanh toán phí quản lý tháng 6
      const june6Payment = paymentsToCreate.find(p => 
        p.household.toString() === household._id.toString() && 
        p.fee.toString() === managementFee._id.toString() &&
        p.paymentDate && 
        p.paymentDate.getMonth() === 5 && // Tháng 6 (index 5)
        p.paymentDate.getFullYear() === new Date().getFullYear() &&
        p.status === 'paid'
      );
      
      if (june6Payment) {
        // Kiểm tra xem đã có khoản nợ tháng 5 chưa
        const may5Payment = paymentsToCreate.find(p => 
          p.household.toString() === household._id.toString() && 
          p.fee.toString() === managementFee._id.toString() &&
          ((p.paymentDate && p.paymentDate.getMonth() === 4) || // Tháng 5 (index 4)
           (p.note && p.note.includes('Tháng 5/')))
        );
        
        // Nếu chưa có khoản nợ tháng 5, tạo mới
        if (!may5Payment) {
          paymentsToCreate.push({
            household: household._id,
            fee: managementFee._id,
            amount: managementFee.amount,
            paymentDate: null, // Không có ngày thanh toán vì chưa thanh toán
            period: new Date(new Date().getFullYear(), 4, 1), // Tháng 5 (index 4)
            method: null,
            status: 'overdue', // Quá hạn
            note: `Phí quản lý hàng tháng quá hạn - Tháng 5/${new Date().getFullYear()}`
          });
          
          console.log(`✅ Đã tạo khoản nợ tháng 5 cho hộ ${household.apartmentNumber}`);
        }
        // Nếu đã có khoản thanh toán tháng 5 nhưng không phải quá hạn, chuyển thành quá hạn
        else if (may5Payment.status !== 'overdue') {
          may5Payment.status = 'overdue';
          may5Payment.paymentDate = null;
          may5Payment.period = new Date(new Date().getFullYear(), 4, 1); // Tháng 5 (index 4)
          may5Payment.method = null;
          may5Payment.note = `Phí quản lý hàng tháng quá hạn - Tháng 5/${new Date().getFullYear()}`;
          
          console.log(`✅ Đã chuyển khoản thanh toán tháng 5 thành quá hạn cho hộ ${household.apartmentNumber}`);
        }
        
        // Thêm các khoản nợ khác cho tháng 5
        // Chọn 2-3 loại phí khác để tạo khoản nợ
        const otherFees = fees.filter(f => f._id.toString() !== managementFee._id.toString())
          .sort(() => 0.5 - Math.random())
          .slice(0, 2 + Math.floor(Math.random() * 2)); // 2-3 loại phí
        
        for (const fee of otherFees) {
          // Kiểm tra xem đã có khoản nợ cho loại phí này chưa
          const existingFeePayment = paymentsToCreate.find(p => 
            p.household.toString() === household._id.toString() && 
            p.fee.toString() === fee._id.toString() &&
            ((p.paymentDate && p.paymentDate.getMonth() === 4) || // Tháng 5 (index 4)
             (p.note && p.note.includes('Tháng 5/')))
          );
          
          if (!existingFeePayment) {
            paymentsToCreate.push({
              household: household._id,
              fee: fee._id,
              amount: fee.amount,
              paymentDate: null,
              period: new Date(new Date().getFullYear(), 4, 1), // Tháng 5 (index 4)
              method: null,
              status: 'overdue',
              note: `${fee.name} quá hạn - Tháng 5/${new Date().getFullYear()}`
            });
            
            console.log(`✅ Đã tạo khoản nợ ${fee.name} tháng 5 cho hộ ${household.apartmentNumber}`);
          }
          else if (existingFeePayment.status !== 'overdue') {
            existingFeePayment.status = 'overdue';
            existingFeePayment.paymentDate = null;
            existingFeePayment.period = new Date(new Date().getFullYear(), 4, 1);
            existingFeePayment.method = null;
            existingFeePayment.note = `${fee.name} quá hạn - Tháng 5/${new Date().getFullYear()}`;
            
            console.log(`✅ Đã chuyển khoản thanh toán ${fee.name} tháng 5 thành quá hạn cho hộ ${household.apartmentNumber}`);
          }
        }
      }
    }
    
    // Thêm thanh toán phí gửi xe cho 30% hộ gia đình
    const parkingFees = fees.filter(fee => fee.feeType === 'parking');
    
    if (parkingFees.length > 0) {
      const parkingHouseholds = allHouseholds
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(allHouseholds.length * 0.3));
      
      for (const household of parkingHouseholds) {
        // Chọn ngẫu nhiên 1-2 loại phí gửi xe
        const numParkingFees = Math.min(parkingFees.length, Math.floor(Math.random() * 2) + 1);
        const selectedParkingFees = parkingFees.sort(() => 0.5 - Math.random()).slice(0, numParkingFees);
        
        for (const fee of selectedParkingFees) {
          paymentsToCreate.push({
            household: household._id,
            fee: fee._id,
            amount: fee.amount,
            paymentDate: new Date(new Date().getFullYear(), 5, Math.floor(Math.random() * 6) + 1), // Ngày 1-6 tháng 6
            period: new Date(new Date().getFullYear(), 5, 1),
            method: 'cash',
            status: Math.random() < 0.95 ? 'paid' : 'pending', // 95% đã thanh toán, 5% đang chờ
            note: `Thanh toán ${fee.name} - Tháng 6/${new Date().getFullYear()}`
          });
        }
      }
    }
    
    // Thêm thanh toán phí đóng góp cho 15% hộ gia đình
    const contributionFees = fees.filter(fee => fee.feeType === 'contribution');
    
    if (contributionFees.length > 0) {
      const contributionHouseholds = allHouseholds
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(allHouseholds.length * 0.15));
      
      for (const household of contributionHouseholds) {
        for (const fee of contributionFees) {
          paymentsToCreate.push({
            household: household._id,
            fee: fee._id,
            amount: fee.amount,
            paymentDate: new Date(new Date().getFullYear(), 5, Math.floor(Math.random() * 6) + 1), // Ngày 1-6 tháng 6
            period: new Date(new Date().getFullYear(), 5, 1),
            method: 'bank_transfer',
            status: Math.random() < 0.9 ? 'paid' : 'pending', // 90% đã thanh toán, 10% đang chờ
            note: `Thanh toán ${fee.name} - Tháng 6/${new Date().getFullYear()}`
          });
        }
      }
    }

    // Xóa thanh toán cũ
    await Payment.deleteMany({});

    // Thêm thanh toán mới theo batch để tránh lỗi
    console.log(`💾 Đang lưu ${paymentsToCreate.length} thanh toán...`);
    
    const batchSize = 100;
    const totalPayments = [];
    
    for (let i = 0; i < paymentsToCreate.length; i += batchSize) {
      const batch = paymentsToCreate.slice(i, i + batchSize);
      try {
        const batchResult = await Payment.insertMany(batch, { ordered: false });
        totalPayments.push(...batchResult);
        console.log(`✅ Đã lưu batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(paymentsToCreate.length/batchSize)}`);
      } catch (error) {
        console.log(`⚠️ Một số thanh toán trong batch ${Math.floor(i/batchSize) + 1} bị trùng lặp, bỏ qua...`);
      }
    }

    console.log(`✅ Đã tạo ${totalPayments.length} thanh toán thành công`);

    // Tạo xe cho các hộ gia đình
    console.log('🚗 Tạo dữ liệu xe...');
    const vehiclesToCreate = [];
    
    // Xóa xe cũ
    await Vehicle.deleteMany({});

    // Dữ liệu mẫu cho xe
    const vehicleTypes = ['Xe máy', 'Ô tô', 'Xe đạp', 'Xe điện'];
    const carBrands = ['Toyota', 'Honda', 'Hyundai', 'Mazda', 'Mitsubishi', 'Suzuki', 'Ford', 'Chevrolet'];
    const motorbikeBrands = ['Honda', 'Yamaha', 'Suzuki', 'SYM', 'Piaggio', 'Kawasaki'];
    const electricBrands = ['VinFast', 'Pega', 'Anbico', 'Gogoro', 'YADEA'];
    const bicycleBrands = ['Giant', 'Trek', 'Asama', 'Fornix', 'TrinX'];
    
    const carModels = ['Vios', 'City', 'Accent', 'CX-5', 'Xpander', 'Swift', 'EcoSport', 'Spark'];
    const motorbikeModels = ['Wave', 'Vision', 'Lead', 'Vario', 'Vespa', 'SH', 'Exciter', 'Winner'];
    const electricModels = ['Klara', 'Ludo', 'Cap-A', 'S2', 'C70s'];
    const bicycleModels = ['Escape', 'FX', 'AM2606', 'Sport', 'TX24'];
    
    const colors = ['Trắng', 'Đen', 'Xám', 'Đỏ', 'Xanh', 'Bạc', 'Vàng', 'Nâu'];
    const parkingSlots = ['A1-01', 'A1-02', 'A1-03', 'B1-01', 'B1-02', 'B2-01', 'B2-02', 'Tầng 1-01', 'Tầng 1-02', 'Tầng 2-01'];

    // 70% hộ gia đình có ít nhất 1 xe
    const householdsWithVehicles = allHouseholds
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(allHouseholds.length * 0.7));

    for (const household of householdsWithVehicles) {
      // Lấy cư dân của hộ gia đình
      const householdResidents = allResidents.filter(r => r.household.toString() === household._id.toString());
      
      if (householdResidents.length === 0) continue;

      // Mỗi hộ có 1-3 xe
      const numVehicles = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numVehicles; i++) {
        const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        
        // Chọn brand và model theo loại xe
        let brands, models;
        switch (vehicleType) {
          case 'Ô tô':
            brands = carBrands;
            models = carModels;
            break;
          case 'Xe máy':
            brands = motorbikeBrands;
            models = motorbikeModels;
            break;
          case 'Xe điện':
            brands = electricBrands;
            models = electricModels;
            break;
          case 'Xe đạp':
            brands = bicycleBrands;
            models = bicycleModels;
            break;
          default:
            brands = motorbikeBrands;
            models = motorbikeModels;
        }

        const brand = brands[Math.floor(Math.random() * brands.length)];
        const model = models[Math.floor(Math.random() * models.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Tạo biển số xe
        let licensePlate;
        if (vehicleType === 'Ô tô') {
          // Biển số xe ô tô: 30A-12345
          const numbers = String(Math.floor(Math.random() * 90000) + 10000);
          const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
          const letter = letters[Math.floor(Math.random() * letters.length)];
          licensePlate = `30${letter}-${numbers}`;
        } else if (vehicleType === 'Xe máy' || vehicleType === 'Xe điện') {
          // Biển số xe máy: 30K1-12345
          const numbers = String(Math.floor(Math.random() * 90000) + 10000);
          const letters = ['K1', 'K2', 'K3', 'K4', 'L1', 'L2', 'M1', 'M2'];
          const letter = letters[Math.floor(Math.random() * letters.length)];
          licensePlate = `30${letter}-${numbers}`;
        } else {
          // Xe đạp không có biển số
          licensePlate = `XD${String(Math.floor(Math.random() * 9000) + 1000)}`;
        }

        // Chọn chủ sở hữu ngẫu nhiên từ cư dân của hộ
        const owner = householdResidents[Math.floor(Math.random() * householdResidents.length)];
        
        // Năm sản xuất
        const year = 2015 + Math.floor(Math.random() * 9); // 2015-2023
        
        // Trạng thái
        const statuses = ['Đang sử dụng', 'Tạm ngưng', 'Đã bán'];
        const statusWeights = [0.85, 0.1, 0.05]; // 85% đang sử dụng, 10% tạm ngưng, 5% đã bán
        
        let status = 'Đang sử dụng';
        const random = Math.random();
        if (random < statusWeights[2]) {
          status = 'Đã bán';
        } else if (random < statusWeights[1] + statusWeights[2]) {
          status = 'Tạm ngưng';
        }

        // Parking slot (chỉ cho xe đang sử dụng)
        const parkingSlot = status === 'Đang sử dụng' && Math.random() < 0.7 
          ? parkingSlots[Math.floor(Math.random() * parkingSlots.length)]
          : '';

        // Ngày đăng ký (1 năm trước)
        const registrationDate = new Date();
        registrationDate.setFullYear(registrationDate.getFullYear() - 1);
        registrationDate.setMonth(Math.floor(Math.random() * 12));
        registrationDate.setDate(Math.floor(Math.random() * 28) + 1);

        vehiclesToCreate.push({
          licensePlate: licensePlate,
          vehicleType: vehicleType,
          brand: brand,
          model: model,
          color: color,
          year: year,
          household: household._id,
          owner: owner._id,
          registrationDate: registrationDate,
          parkingSlot: parkingSlot,
          status: status,
          note: `${vehicleType} ${brand} ${model} - Đăng ký ${registrationDate.toLocaleDateString('vi-VN')}`,
          active: true
        });
      }
    }

    // Lưu xe vào database
    const vehicles = await Vehicle.insertMany(vehiclesToCreate);
    console.log(`✅ Đã tạo ${vehicles.length} xe mới`);

    // Thống kê cuối cùng
    console.log('\n📊 THỐNG KÊ TỔNG KẾT:');
    
    const finalHouseholdCount = await Household.countDocuments({ active: true });
    const finalResidentCount = await Resident.countDocuments({ active: true });
    const finalVehicleCount = await Vehicle.countDocuments({ active: true });
    const finalPaymentCount = await Payment.countDocuments({ status: 'paid' });
    const finalFeeCount = await Fee.countDocuments({ active: true });
    
    console.log(`🏠 Tổng số hộ gia đình: ${finalHouseholdCount}`);
    console.log(`👥 Tổng số cư dân: ${finalResidentCount}`);
    console.log(`🚗 Tổng số xe: ${finalVehicleCount}`);
    console.log(`💰 Tổng số thanh toán: ${finalPaymentCount}`);
    console.log(`📋 Tổng số loại phí: ${finalFeeCount}`);

    // Thống kê xe theo loại
    const vehiclesByType = await Vehicle.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n--- Thống kê xe theo loại ---');
    for (const type of vehiclesByType) {
      console.log(`${type._id}: ${type.count} xe`);
    }

    // Thống kê doanh thu tháng hiện tại
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const currentMonthEnd = new Date();
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    const currentMonthPayments = await Payment.find({
      paymentDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: 'paid'
    });

    const currentMonthRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    console.log(`💵 Doanh thu tháng hiện tại: ${currentMonthRevenue.toLocaleString()} VND`);
    console.log(`📈 Số thanh toán tháng hiện tại: ${currentMonthPayments.length}`);
    
    // Thống kê doanh thu tháng 6 đến ngày 6/6
    const june6Start = new Date(new Date().getFullYear(), 5, 1); // 1/6
    const june6End = new Date(new Date().getFullYear(), 5, 6, 23, 59, 59, 999); // 6/6
    
    const june6Payments = await Payment.find({
      paymentDate: { $gte: june6Start, $lte: june6End },
      status: 'paid'
    }).populate('fee').populate('household');
    
    const june6Revenue = june6Payments.reduce((sum, p) => sum + p.amount, 0);
    
    console.log('\n📊 THỐNG KÊ DOANH THU THÁNG 6 (đến ngày 6/6):');
    console.log(`💰 Tổng số thanh toán: ${june6Payments.length}`);
    console.log(`💵 Tổng doanh thu: ${june6Revenue.toLocaleString()} VND`);
    
    // Thống kê theo loại phí
    const revenueByFeeType = {};
    for (const payment of june6Payments) {
      const feeType = payment.fee.feeType;
      if (!revenueByFeeType[feeType]) {
        revenueByFeeType[feeType] = 0;
      }
      revenueByFeeType[feeType] += payment.amount;
    }
    
    console.log('\n--- Doanh thu theo loại phí ---');
    for (const [feeType, amount] of Object.entries(revenueByFeeType)) {
      let feeTypeName;
      switch(feeType) {
        case 'mandatory': feeTypeName = 'Phí bắt buộc'; break;
        case 'voluntary': feeTypeName = 'Phí tự nguyện'; break;
        case 'contribution': feeTypeName = 'Phí đóng góp'; break;
        case 'parking': feeTypeName = 'Phí gửi xe'; break;
        case 'utilities': feeTypeName = 'Phí tiện ích'; break;
        default: feeTypeName = feeType;
      }
      console.log(`${feeTypeName}: ${amount.toLocaleString()} VND`);
    }

    // Thống kê các khoản thanh toán quá hạn
    const overduePayments = await Payment.find({
      status: 'overdue'
    }).populate('fee').populate('household');
    
    const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    
    console.log('\n📊 THỐNG KÊ CÁC KHOẢN THANH TOÁN QUÁ HẠN:');
    console.log(`❗ Tổng số khoản quá hạn: ${overduePayments.length}`);
    console.log(`💵 Tổng giá trị quá hạn: ${overdueAmount.toLocaleString()} VND`);
    
    // Thống kê theo loại phí
    const overdueByFeeType = {};
    for (const payment of overduePayments) {
      const feeType = payment.fee.feeType;
      if (!overdueByFeeType[feeType]) {
        overdueByFeeType[feeType] = {
          count: 0,
          amount: 0
        };
      }
      overdueByFeeType[feeType].count += 1;
      overdueByFeeType[feeType].amount += payment.amount;
    }
    
    console.log('\n--- Khoản quá hạn theo loại phí ---');
    for (const [feeType, data] of Object.entries(overdueByFeeType)) {
      let feeTypeName;
      switch(feeType) {
        case 'mandatory': feeTypeName = 'Phí bắt buộc'; break;
        case 'voluntary': feeTypeName = 'Phí tự nguyện'; break;
        case 'contribution': feeTypeName = 'Phí đóng góp'; break;
        case 'parking': feeTypeName = 'Phí gửi xe'; break;
        case 'utilities': feeTypeName = 'Phí tiện ích'; break;
        default: feeTypeName = feeType;
      }
      console.log(`${feeTypeName}: ${data.count} khoản - ${data.amount.toLocaleString()} VND`);
    }
    
    // Đếm số hộ gia đình có khoản quá hạn
    const householdsWithOverdue = [...new Set(overduePayments.map(p => p.household._id.toString()))];
    console.log(`🏠 Số hộ gia đình có khoản quá hạn: ${householdsWithOverdue.length}/${allHouseholds.length} (${Math.round(householdsWithOverdue.length/allHouseholds.length*100)}%)`);
    
    // Đếm số hộ gia đình có khoản quá hạn nhưng đã thanh toán tháng hiện tại
    const householdsWithOverdueAndCurrentPaid = [];
    for (const householdId of householdsWithOverdue) {
      const hasCurrentPaid = await Payment.exists({
        household: householdId,
        status: 'paid',
        paymentDate: { $gte: june6Start, $lte: june6End }
      });
      
      if (hasCurrentPaid) {
        householdsWithOverdueAndCurrentPaid.push(householdId);
      }
    }
    
    console.log(`🏠 Số hộ gia đình có khoản quá hạn nhưng đã thanh toán tháng hiện tại: ${householdsWithOverdueAndCurrentPaid.length}/${householdsWithOverdue.length} (${Math.round(householdsWithOverdueAndCurrentPaid.length/householdsWithOverdue.length*100)}%)`);

  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu:', error);
    throw error;
  }
}

// Hàm tạo các loại phí
async function createFees() {
  console.log('💲 Kiểm tra và tạo các loại phí...');
  
  try {
    // Kiểm tra xem đã có loại phí nào chưa
    const feeCount = await Fee.countDocuments();
    
    if (feeCount > 0) {
      console.log(`✅ Đã có ${feeCount} loại phí, bỏ qua bước này.`);
      return;
    }
    
    // Tạo các loại phí
    const fees = [
      {
        feeCode: 'PHI001',
        name: 'Phí quản lý hàng tháng',
        amount: 500000,
        feeType: 'mandatory',
        description: 'Phí quản lý hàng tháng cho mỗi căn hộ',
        startDate: new Date('2023-01-01'),
        active: true
      },
      {
        feeCode: 'PHI002',
        name: 'Phí gửi xe ô tô',
        amount: 1200000,
        feeType: 'parking',
        description: 'Phí gửi xe ô tô hàng tháng',
        startDate: new Date('2023-01-01'),
        active: true
      },
      {
        feeCode: 'PHI003',
        name: 'Phí gửi xe máy',
        amount: 100000,
        feeType: 'parking',
        description: 'Phí gửi xe máy hàng tháng',
        startDate: new Date('2023-01-01'),
        active: true
      },
      {
        feeCode: 'PHI004',
        name: 'Phí sửa chữa công trình chung',
        amount: 200000,
        feeType: 'contribution',
        description: 'Phí đóng góp cho việc sửa chữa các công trình chung',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-12-31'),
        active: true
      },
      {
        feeCode: 'PHI005',
        name: 'Phí gửi xe',
        amount: 50000,
        feeType: 'parking',
        description: 'Phí gửi xe đạp, xe điện và các loại xe khác hàng tháng',
        startDate: new Date('2023-01-01'),
        active: true
      },
      {
        feeCode: 'PHI006',
        name: 'Phí dịch vụ chung cư',
        amount: 5000,
        feeType: 'mandatory',
        description: 'Phí dịch vụ chung cư tính theo diện tích căn hộ - 5,000 VND/m²/tháng',
        startDate: new Date('2024-01-01'),
        active: true
      },
      {
        feeCode: 'PHI007',
        name: 'Phí quản lý chung cư',
        amount: 7000,
        feeType: 'mandatory',
        description: 'Phí quản lý chung cư tính theo diện tích căn hộ - 7,000 VND/m²/tháng',
        startDate: new Date('2024-01-01'),
        active: true
      }
    ];
    
    await Fee.insertMany(fees);
    console.log(`✅ Đã tạo ${fees.length} loại phí.`);
  } catch (error) {
    console.error('❌ Lỗi khi tạo loại phí:', error);
    throw error;
  }
}