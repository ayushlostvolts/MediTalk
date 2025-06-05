const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
    },
    duration: {
        type: Number, // in minutes
        default: 0,
    },
    billAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'pending',
    },
    stripeChargeId: {
        type: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Call', CallSchema);
