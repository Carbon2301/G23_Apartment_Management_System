const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  feeCode: {
    type: String,
    required: [true, 'Fee code is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Fee name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be at least 0']
  },
  feeType: {
    type: String,
    enum: ['mandatory', 'voluntary', 'contribution', 'parking', 'utilities'],
    default: 'mandatory'
  },
  description: {
    type: String
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual to check if fee is currently active based on date range
feeSchema.virtual('isCurrentlyActive').get(function() {
  if (!this.active) return false;
  
  const today = new Date();
  
  if (this.startDate && today < this.startDate) {
    return false;
  }
  
  if (this.endDate && today > this.endDate) {
    return false;
  }
  
  return true;
});

module.exports = mongoose.model('Fee', feeSchema); 