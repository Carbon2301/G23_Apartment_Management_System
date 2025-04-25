const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['Xe máy', 'Ô tô', 'Xe đạp', 'Xe điện']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  household: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    required: [true, 'Household is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: [true, 'Owner is required']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  parkingSlot: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Đang sử dụng', 'Tạm ngưng', 'Đã bán'],
    default: 'Đang sử dụng'
  },
  note: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
vehicleSchema.index({ household: 1 });
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ licensePlate: 1 });

// Virtual for formatted registration date
vehicleSchema.virtual('formattedRegistrationDate').get(function() {
  return this.registrationDate ? this.registrationDate.toLocaleDateString('vi-VN') : '';
});

module.exports = mongoose.model('Vehicle', vehicleSchema); 