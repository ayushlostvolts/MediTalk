const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const router = express.Router();

// Generate JWT
const generateToken = (id, type) => {
    return jwt.sign({ id, type }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};

// User Register
router.post('/user/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User.create({ name, email, password });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id, 'user'),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Login
router.post('/user/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id, 'user'),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Doctor Register
router.post('/doctor/register', async (req, res) => {
    const { name, email, password, specialty, experience, ratePerMinute } = req.body;
    try {
        const doctorExists = await Doctor.findOne({ email });
        if (doctorExists) {
            return res.status(400).json({ message: 'Doctor already exists' });
        }
        const doctor = await Doctor.create({ name, email, password, specialty, experience, ratePerMinute });
        res.status(201).json({
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            specialty: doctor.specialty,
            token: generateToken(doctor._id, 'doctor'),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Doctor Login
router.post('/doctor/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const doctor = await Doctor.findOne({ email });
        if (doctor && (await doctor.matchPassword(password))) {
            res.json({
                _id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                specialty: doctor.specialty,
                token: generateToken(doctor._id, 'doctor'),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
