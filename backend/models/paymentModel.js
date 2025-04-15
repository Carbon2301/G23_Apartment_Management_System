const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
  {
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Fee'
    },
    household: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Household'
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paymentDate: {
      type: Date
    },
    dueDate: {
      type: Date
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'card', 'other'],
      default: 'cash'
    },
    collector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: {
      type: String
    },
    period: {
      type: Date,
      description: 'The month/year this payment is for (e.g., for debt payments)'
    }
  },
  {
    timestamps: true
  }
);

// Ensure uniqueness of fee-household-period combination
paymentSchema.index({ fee: 1, household: 1, period: 1 }, { unique: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 