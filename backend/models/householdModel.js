const mongoose = require('mongoose');

const householdSchema = new mongoose.Schema({
  apartmentNumber: {
    type: String,
    required: [true, 'Apartment number is required'],
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  area: {
    type: Number,
    required: [true, 'Apartment area is required'],
    min: [1, 'Area must be at least 1 square meter'],
    max: [1000, 'Area cannot exceed 1000 square meters']
  },
  householdHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident'
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String
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

// Virtual for residents in this household
householdSchema.virtual('residents', {
  ref: 'Resident',
  localField: '_id',
  foreignField: 'household',
  justOne: false
});

// Cascade delete residents when a household is deleted
householdSchema.pre('remove', async function(next) {
  await this.model('Resident').deleteMany({ household: this._id });
  next();
});

module.exports = mongoose.model('Household', householdSchema); 