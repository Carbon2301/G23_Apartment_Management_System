const Resident = require('../models/residentModel');
const Household = require('../models/householdModel');

// @desc    Get all residents
// @route   GET /api/residents
// @access  Private
exports.getResidents = async (req, res) => {
  try {
    const { household } = req.query;
    
    // Build filter query
    const filter = {};
    if (household) {
      filter.household = household;
    }
    
    const residents = await Resident.find(filter)
      .populate('household', 'apartmentNumber area');
    
    res.json(residents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single resident
// @route   GET /api/residents/:id
// @access  Private
exports.getResidentById = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .populate('household', 'apartmentNumber address area');
    
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    
    res.json(resident);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Resident not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a resident
// @route   POST /api/residents
// @access  Private/Admin
exports.createResident = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      idCard,
      idCardDate,
      idCardPlace,
      placeOfBirth,
      nationality,
      ethnicity,
      religion,
      occupation,
      workplace,
      phone,
      household,
      note,
      tempStatus,
      tempStartDate,
      tempEndDate,
      tempReason
    } = req.body;
    
    // Check if resident with this ID card already exists
    if (idCard) {
      const residentExists = await Resident.findOne({ idCard });
      
      if (residentExists) {
        return res.status(400).json({ message: 'Resident with this ID card already exists' });
      }
    }
    
    // Check if household exists
    if (household) {
      const householdExists = await Household.findById(household);
      
      if (!householdExists) {
        return res.status(404).json({ message: 'Household not found' });
      }
    }
    
    const resident = await Resident.create({
      fullName,
      dateOfBirth,
      gender,
      idCard,
      idCardDate,
      idCardPlace,
      placeOfBirth,
      nationality,
      ethnicity,
      religion,
      occupation,
      workplace,
      phone,
      household,
      note,
      tempStatus,
      tempStartDate,
      tempEndDate,
      tempReason
    });

    // Auto-assign as household head if this is the first resident and no head exists
    if (household) {
      const householdDoc = await Household.findById(household);
      if (householdDoc && !householdDoc.householdHead) {
        householdDoc.householdHead = resident._id;
        await householdDoc.save();
        console.log(`Auto-assigned ${resident.fullName} as head of household ${householdDoc.apartmentNumber}`);
      }
    }
    
    res.status(201).json(resident);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a resident
// @route   PUT /api/residents/:id
// @access  Private/Admin
exports.updateResident = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    
    // If changing ID card, check if it's already in use
    if (req.body.idCard && req.body.idCard !== resident.idCard) {
      const idCardExists = await Resident.findOne({ idCard: req.body.idCard });
      if (idCardExists) {
        return res.status(400).json({ message: 'ID card already in use' });
      }
    }
    
    // If changing household, check if it exists
    if (req.body.household && req.body.household !== resident.household?.toString()) {
      const householdExists = await Household.findById(req.body.household);
      if (!householdExists) {
        return res.status(404).json({ message: 'Household not found' });
      }
    }
    
    // Update fields
    const fields = [
      'fullName', 'dateOfBirth', 'gender', 'idCard', 'idCardDate', 'idCardPlace',
      'placeOfBirth', 'nationality', 'ethnicity', 'religion', 'occupation', 'workplace',
      'phone', 'household', 'note', 'active', 'tempStatus', 'tempStartDate', 'tempEndDate', 'tempReason'
    ];
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        resident[field] = req.body[field];
      }
    });
    
    const updatedResident = await resident.save();
    
    res.json(updatedResident);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Resident not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a resident (hard delete)
// @route   DELETE /api/residents/:id
// @access  Private/Admin
exports.deleteResident = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    
    // If this resident is a household head, auto-assign a new head or remove reference
    if (resident.household) {
      const household = await Household.findById(resident.household);
      if (household && household.householdHead?.toString() === resident._id.toString()) {
        // Find another resident in the same household to be the new head
        const otherResident = await Resident.findOne({ 
          household: resident.household, 
          _id: { $ne: resident._id } 
        });
        
        if (otherResident) {
          household.householdHead = otherResident._id;
          console.log(`Auto-assigned ${otherResident.fullName} as new head of household ${household.apartmentNumber}`);
        } else {
          household.householdHead = null;
          console.log(`Removed household head for household ${household.apartmentNumber} (no other residents)`);
        }
        
        await household.save();
      }
    }
    
    // Hard delete the resident
    await Resident.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Resident deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Resident not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Search residents
// @route   GET /api/residents/search
// @access  Private
exports.searchResidents = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const residents = await Resident.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { idCard: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).populate('household', 'apartmentNumber');
    
    res.json(residents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
}; 