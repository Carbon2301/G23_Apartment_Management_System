const Household = require('../models/householdModel');
const Resident = require('../models/residentModel');

// @desc    Get all households
// @route   GET /api/households
// @access  Private
exports.getHouseholds = async (req, res) => {
  try {
    const households = await Household.find({ active: true }).populate('householdHead', 'fullName');
    res.json(households);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single household
// @route   GET /api/households/:id
// @access  Private
exports.getHouseholdById = async (req, res) => {
  try {
    const household = await Household.findOne({ _id: req.params.id, active: true })
      .populate('householdHead', 'fullName dateOfBirth gender idCard phone');
    
    if (!household) {
      return res.status(404).json({ message: 'Household not found or has been deleted' });
    }
    
    res.json(household);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Household not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a household
// @route   POST /api/households
// @access  Private/Admin
exports.createHousehold = async (req, res) => {
  try {
    const { apartmentNumber, address, area, note } = req.body;
    
    // Check if household already exists
    const householdExists = await Household.findOne({ apartmentNumber });
    
    if (householdExists) {
      return res.status(400).json({ message: 'Household with this apartment number already exists' });
    }
    
    const household = await Household.create({
      apartmentNumber,
      address,
      area,
      note
    });
    
    res.status(201).json(household);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a household
// @route   PUT /api/households/:id
// @access  Private/Admin
exports.updateHousehold = async (req, res) => {
  try {
    const { apartmentNumber, address, area, householdHead, note, active } = req.body;
    
    const household = await Household.findById(req.params.id);
    
    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }
    
    // If changing apartment number, check if it's already in use
    if (apartmentNumber && apartmentNumber !== household.apartmentNumber) {
      const apartmentExists = await Household.findOne({ apartmentNumber });
      if (apartmentExists) {
        return res.status(400).json({ message: 'Apartment number already in use' });
      }
    }
    
    // If setting household head, verify the resident exists
    if (householdHead && householdHead !== household.householdHead) {
      const resident = await Resident.findById(householdHead);
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found for household head' });
      }
    }
    
    household.apartmentNumber = apartmentNumber || household.apartmentNumber;
    household.address = address || household.address;
    household.area = area !== undefined ? area : household.area;
    household.householdHead = householdHead || household.householdHead;
    household.note = note !== undefined ? note : household.note;
    household.active = active !== undefined ? active : household.active;
    
    const updatedHousehold = await household.save();
    
    res.json(updatedHousehold);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Household not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a household (soft delete)
// @route   DELETE /api/households/:id
// @access  Private/Admin
exports.deleteHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);
    
    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }
    
    // Check if household is already inactive
    if (!household.active) {
      return res.status(400).json({ 
        message: 'Hộ gia đình này đã được xóa trước đó.'
      });
    }
    
    // Soft delete by setting active to false
    household.active = false;
    await household.save();
    
    // Also set all residents in this household to inactive (optional)
    await Resident.updateMany(
      { household: req.params.id },
      { active: false }
    );
    
    res.json({ 
      message: 'Hộ gia đình đã được xóa thành công',
      household: {
        id: household._id,
        apartmentNumber: household.apartmentNumber,
        active: household.active
      }
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Household not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get residents in a household
// @route   GET /api/households/:id/residents
// @access  Private
exports.getHouseholdResidents = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);
    
    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }
    
    const residents = await Resident.find({ household: req.params.id });
    
    res.json(residents);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Household not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Restore a deleted household
// @route   PUT /api/households/:id/restore
// @access  Private/Admin
exports.restoreHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);
    
    if (!household) {
      return res.status(404).json({ message: 'Household not found' });
    }
    
    if (household.active) {
      return res.status(400).json({ 
        message: 'Hộ gia đình này vẫn đang hoạt động.'
      });
    }
    
    // Restore household by setting active to true
    household.active = true;
    await household.save();
    
    res.json({ 
      message: 'Hộ gia đình đã được khôi phục thành công',
      household: {
        id: household._id,
        apartmentNumber: household.apartmentNumber,
        active: household.active
      }
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Household not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
}; 