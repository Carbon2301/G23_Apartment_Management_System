const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: [true, 'Resident ID is required']
  },
  relatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: [true, 'Related resident ID is required']
  },
  relationship: {
    type: String,
    enum: [
      'spouse', 'parent', 'child', 'sibling', 
      'grandparent', 'grandchild', 'aunt/uncle', 
      'niece/nephew', 'cousin', 'in-law', 'other'
    ],
    required: [true, 'Relationship type is required']
  },
  note: {
    type: String
  }
}, {
  timestamps: true
});

// Create a compound index to prevent duplicate relationships
relationshipSchema.index({ resident: 1, relatedTo: 1 }, { unique: true });

module.exports = mongoose.model('Relationship', relationshipSchema); 