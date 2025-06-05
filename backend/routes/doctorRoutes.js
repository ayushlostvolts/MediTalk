const express = require('express');
const { protect, doctorProtect } = require('../middleware/authMiddleware');
const Doctor = require('../models/Doctor');

const router = express.Router();

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find({}).select('-password');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get doctor profile
// @route   GET /api/doctors/profile
// @access  Private (Doctor only)
router.get('/profile', protect, doctorProtect, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.doctor._id).select('-password');
        if (doctor) {
            res.json(doctor);
        } else {
            res.status(404).json({ message: 'Doctor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update doctor availability
// @route   PUT /api/doctors/availability
// @access  Private (Doctor only)
router.put('/availability', protect, doctorProtect, async (req, res) => {
    const { isAvailable } = req.body;
    try {
        const doctor = await Doctor.findById(req.doctor._id);
        if (doctor) {
            doctor.isAvailable = isAvailable;
            const updatedDoctor = await doctor.save();
            res.json({
                _id: updatedDoctor._id,
                name: updatedDoctor.name,
                email: updatedDoctor.email,
                specialty: updatedDoctor.specialty,
                isAvailable: updatedDoctor.isAvailable,
            });
        } else {
            res.status(404).json({ message: 'Doctor not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
