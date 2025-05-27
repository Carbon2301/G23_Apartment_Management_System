require('dotenv').config();
const mongoose = require('mongoose');
const Household = require('../../models/householdModel');
const Resident = require('../../models/residentModel');

const setHouseholdHeads = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const households = await Household.find();
    console.log(`Found ${households.length} households`);

    for (const household of households) {
      // Tìm cư dân đầu tiên trong hộ gia đình (theo thứ tự tạo)
      const firstResident = await Resident.findOne({ household: household._id }).sort({ createdAt: 1 });
      
      if (firstResident) {
        // Cập nhật chủ hộ (dù có hay chưa có)
        household.householdHead = firstResident._id;
        await household.save();
        console.log(`Set ${firstResident.fullName} as head of household ${household.apartmentNumber}`);
      } else {
        console.log(`Household ${household.apartmentNumber} has no residents`);
      }
    }

    console.log('Finished setting household heads');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

setHouseholdHeads(); 