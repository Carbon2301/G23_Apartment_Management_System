const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/vehicleModel');
const Household = require('../models/householdModel');
const Resident = require('../models/residentModel');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
const getVehicles = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const keyword = req.query.keyword
    ? {
        $or: [
          { licensePlate: { $regex: req.query.keyword, $options: 'i' } },
          { brand: { $regex: req.query.keyword, $options: 'i' } },
          { model: { $regex: req.query.keyword, $options: 'i' } },
          { color: { $regex: req.query.keyword, $options: 'i' } }
        ]
      }
    : {};

  const householdFilter = req.query.household
    ? { household: req.query.household }
    : {};

  const statusFilter = req.query.status
    ? { status: req.query.status }
    : {};

  const typeFilter = req.query.vehicleType
    ? { vehicleType: req.query.vehicleType }
    : {};

  const filter = {
    active: true,
    ...keyword,
    ...householdFilter,
    ...statusFilter,
    ...typeFilter
  };

  const totalVehicles = await Vehicle.countDocuments(filter);
  const vehicles = await Vehicle.find(filter)
    .populate('household', 'apartmentNumber address area')
    .populate('owner', 'fullName identityCard phoneNumber')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  res.json({
    vehicles,
    currentPage: page,
    totalPages: Math.ceil(totalVehicles / limit),
    totalVehicles
  });
});

// @desc    Get vehicles by household
// @route   GET /api/vehicles/household/:householdId
// @access  Private
const getVehiclesByHousehold = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({
    household: req.params.householdId,
    active: true
  })
    .populate('owner', 'fullName identityCard phoneNumber')
    .sort({ createdAt: -1 });

  res.json(vehicles);
});

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('household', 'apartmentNumber address area')
    .populate('owner', 'fullName identityCard phoneNumber');

  if (vehicle && vehicle.active) {
    res.json(vehicle);
  } else {
    res.status(404);
    throw new Error('Vehicle not found');
  }
});

// @desc    Create vehicle
// @route   POST /api/vehicles
// @access  Private
const createVehicle = asyncHandler(async (req, res) => {
  const {
    licensePlate,
    vehicleType,
    brand,
    model,
    color,
    year,
    household,
    owner,
    parkingSlot,
    note
  } = req.body;

  // Validate household exists
  const householdExists = await Household.findById(household);
  if (!householdExists) {
    res.status(400);
    throw new Error('Household not found');
  }

  // Validate owner exists and belongs to household
  const ownerExists = await Resident.findOne({
    _id: owner,
    household: household,
    active: true
  });
  if (!ownerExists) {
    res.status(400);
    throw new Error('Owner not found or does not belong to this household');
  }

  // Check if license plate already exists
  const licensePlateExists = await Vehicle.findOne({
    licensePlate: licensePlate.toUpperCase(),
    active: true
  });
  if (licensePlateExists) {
    res.status(400);
    throw new Error('License plate already exists');
  }

  const vehicle = await Vehicle.create({
    licensePlate: licensePlate.toUpperCase(),
    vehicleType,
    brand,
    model,
    color,
    year,
    household,
    owner,
    parkingSlot,
    note
  });

  const createdVehicle = await Vehicle.findById(vehicle._id)
    .populate('household', 'apartmentNumber address area')
    .populate('owner', 'fullName identityCard phoneNumber');

  res.status(201).json(createdVehicle);
});

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
const updateVehicle = asyncHandler(async (req, res) => {
  const {
    licensePlate,
    vehicleType,
    brand,
    model,
    color,
    year,
    household,
    owner,
    parkingSlot,
    status,
    note
  } = req.body;

  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle || !vehicle.active) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  // Check if license plate already exists (excluding current vehicle)
  if (licensePlate && licensePlate.toUpperCase() !== vehicle.licensePlate) {
    const licensePlateExists = await Vehicle.findOne({
      licensePlate: licensePlate.toUpperCase(),
      _id: { $ne: req.params.id },
      active: true
    });
    if (licensePlateExists) {
      res.status(400);
      throw new Error('License plate already exists');
    }
  }

  // Validate household exists if being updated
  if (household && household !== vehicle.household.toString()) {
    const householdExists = await Household.findById(household);
    if (!householdExists) {
      res.status(400);
      throw new Error('Household not found');
    }
  }

  // Validate owner exists and belongs to household if being updated
  if (owner && (owner !== vehicle.owner.toString() || household !== vehicle.household.toString())) {
    const ownerExists = await Resident.findOne({
      _id: owner,
      household: household || vehicle.household,
      active: true
    });
    if (!ownerExists) {
      res.status(400);
      throw new Error('Owner not found or does not belong to this household');
    }
  }

  vehicle.licensePlate = licensePlate?.toUpperCase() || vehicle.licensePlate;
  vehicle.vehicleType = vehicleType || vehicle.vehicleType;
  vehicle.brand = brand || vehicle.brand;
  vehicle.model = model || vehicle.model;
  vehicle.color = color || vehicle.color;
  vehicle.year = year || vehicle.year;
  vehicle.household = household || vehicle.household;
  vehicle.owner = owner || vehicle.owner;
  vehicle.parkingSlot = parkingSlot || vehicle.parkingSlot;
  vehicle.status = status || vehicle.status;
  vehicle.note = note || vehicle.note;

  const updatedVehicle = await vehicle.save();

  const populatedVehicle = await Vehicle.findById(updatedVehicle._id)
    .populate('household', 'apartmentNumber address area')
    .populate('owner', 'fullName identityCard phoneNumber');

  res.json(populatedVehicle);
});

// @desc    Delete vehicle (soft delete)
// @route   DELETE /api/vehicles/:id
// @access  Private
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle || !vehicle.active) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  vehicle.active = false;
  await vehicle.save();

  res.json({ message: 'Vehicle removed' });
});

// @desc    Get vehicle statistics
// @route   GET /api/vehicles/stats
// @access  Private
const getVehicleStats = asyncHandler(async (req, res) => {
  const totalVehicles = await Vehicle.countDocuments({ active: true });
  
  const vehiclesByType = await Vehicle.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const vehiclesByStatus = await Vehicle.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const recentVehicles = await Vehicle.find({ active: true })
    .populate('household', 'apartmentNumber')
    .populate('owner', 'fullName')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    totalVehicles,
    vehiclesByType,
    vehiclesByStatus,
    recentVehicles
  });
});

module.exports = {
  getVehicles,
  getVehiclesByHousehold,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats
}; 