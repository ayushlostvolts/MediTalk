const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.type === 'user') {
                req.user = await User.findById(decoded.id).select('-password');
                req.userType = 'user';
            } else if (decoded.type === 'doctor') {
                req.doctor = await Doctor.findById(decoded.id).select('-password');
                req.userType = 'doctor';
            } else {
                return res.status(401).json({ message: 'Not authorized, invalid token type' });
            }
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const doctorProtect = (req, res, next) => {
    if (req.userType === 'doctor') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a doctor' });
    }
};

const userProtect = (req, res, next) => {
    if (req.userType === 'user') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a user' });
    }
};

module.exports = { protect, doctorProtect, userProtect };
