const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  idCard: {
    type: String,
    unique: true,
    sparse: true, // allows multiple null values
    trim: true
  },
  idCardDate: {
    type: Date
  },
  idCardPlace: {
    type: String
  },
  placeOfBirth: {
    type: String
  },
  nationality: {
    type: String,
    default: 'Việt Nam'
  },
  ethnicity: {
    type: String,
    default: 'Kinh'
  },
  religion: {
    type: String,
    default: 'Không'
  },
  occupation: {
    type: String
  },
  workplace: {
    type: String
  },
  phone: {
    type: String
  },
  household: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household'
  },
  note: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  tempStatus: {
    type: String,
    enum: ['none', 'tam_tru', 'tam_vang'],
    default: 'none'
  },
  tempStartDate: {
    type: Date
  },
  tempEndDate: {
    type: Date
  },
  tempReason: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual for age
residentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

module.exports = mongoose.model('Resident', residentSchema); 