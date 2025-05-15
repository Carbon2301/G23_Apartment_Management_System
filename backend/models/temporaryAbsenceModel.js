const mongoose = require('mongoose');

const temporaryAbsenceSchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: [true, 'Resident ID is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date
  },
  destination: {
    type: String,
    required: [true, 'Destination is required']
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

// Virtual to check if temporary absence is currently active
temporaryAbsenceSchema.virtual('isActive').get(function() {
  const today = new Date();
  
  if (today < this.startDate) {
    return false;
  }
  
  if (this.endDate && today > this.endDate) {
    return false;
  }
  
  return true;
});

module.exports = mongoose.model('TemporaryAbsence', temporaryAbsenceSchema); 