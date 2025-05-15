const mongoose = require('mongoose');

const temporaryResidenceSchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: [true, 'Resident ID is required']
  },
  household: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    required: [true, 'Household ID is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date
  },
  previousAddress: {
    type: String
  },
  reason: {
    type: String
  },
  note: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual to check if temporary residence is currently active
temporaryResidenceSchema.virtual('isActive').get(function() {
  const today = new Date();
  
  if (today < this.startDate) {
    return false;
  }
  
  if (this.endDate && today > this.endDate) {
    return false;
  }
  
  return true;
});

module.exports = mongoose.model('TemporaryResidence', temporaryResidenceSchema); 