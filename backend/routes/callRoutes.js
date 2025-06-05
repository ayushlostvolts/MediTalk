const express = require('express');
const { protect, userProtect, doctorProtect } = require('../middleware/authMiddleware');
const Call = require('../models/Call');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const router = express.Router();

// @desc    Initiate a call
// @route   POST /api/calls/initiate
// @access  Private (User only)
router.post('/initiate', protect, userProtect, async (req, res) => {
    const { doctorId } = req.body;
    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        if (!doctor.isAvailable) {
            return res.status(400).json({ message: 'Doctor is not available' });
        }

        // Check if user already has an active call
        const activeCall = await Call.findOne({ user: req.user._id, status: 'active' });
        if (activeCall) {
            return res.status(400).json({ message: 'You already have an active call.' });
        }

        // Create a new call entry
        const call = await Call.create({
            user: req.user._id,
            doctor: doctorId,
            startTime: new Date(),
            status: 'active',
        });

        res.status(201).json({
            message: 'Call initiated',
            callId: call._id,
            doctorName: doctor.name,
            userName: req.user.name,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    End a call
// @route   POST /api/calls/end/:callId
// @access  Private (User or Doctor)
router.post('/end/:callId', protect, async (req, res) => {
    const { callId } = req.params;
    try {
        const call = await Call.findById(callId);

        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        // Ensure only participating user/doctor can end the call
        if (req.userType === 'user' && call.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to end this call' });
        }
        if (req.userType === 'doctor' && call.doctor.toString() !== req.doctor._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to end this call' });
        }

        if (call.status === 'active') {
            call.endTime = new Date();
            const durationMs = call.endTime - call.startTime;
            const durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Round up to nearest minute

            const doctor = await Doctor.findById(call.doctor);
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found for billing' });
            }

            call.duration = durationMinutes;
            call.billAmount = durationMinutes * doctor.ratePerMinute;
            call.status = 'completed';

            await call.save();

            // Update user's consultation history
            const user = await User.findById(call.user);
            if (user) {
                user.consultationHistory.push({
                    doctor: call.doctor,
                    callDuration: call.duration,
                    billAmount: call.billAmount,
                    callDate: call.startTime,
                });
                await user.save();
            }

            // Trigger payment processing
            // In a real application, this would be a more robust background process or webhook
            // For this example, we'll make an internal API call.
            try {
                await fetch('http://localhost:5000/api/payments/process-call-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': req.headers.authorization // Pass the user's JWT token
                    },
                    body: JSON.stringify({ callId: call._id }),
                });
                res.json({
                    message: 'Call ended and billed, payment initiated',
                    callId: call._id,
                    duration: call.duration,
                    billAmount: call.billAmount,
                });
            } catch (paymentError) {
                console.error('Error initiating payment:', paymentError);
                res.status(500).json({ message: 'Call ended, but payment initiation failed.' });
            }
        } else {
            res.status(400).json({ message: 'Call is not active' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
