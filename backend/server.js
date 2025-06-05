require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for now, refine later
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctorRoutes');
const userRoutes = require('./routes/userRoutes');
const callRoutes = require('./routes/callRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // Import payment routes
const Call = require('./models/Call'); // Import Call model

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/payments', paymentRoutes); // Use payment routes

// Basic Route
app.get('/', (req, res) => {
    res.send('DoctorTalk Backend API');
});

// Socket.IO connection for WebRTC signaling and call management
const activeCalls = {}; // Stores active call information: { callId: { userId, doctorId, timer, startTime, userSocketId, doctorSocketId } }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a call room
    socket.on('joinCall', async ({ callId, userId, doctorId, userType }) => {
        socket.join(callId);
        console.log(`${userType} ${socket.id} joined call ${callId}`);

        if (!activeCalls[callId]) {
            activeCalls[callId] = {
                userId,
                doctorId,
                userSocketId: userType === 'user' ? socket.id : null,
                doctorSocketId: userType === 'doctor' ? socket.id : null,
                timer: null,
                startTime: null,
            };
        } else {
            if (userType === 'user') {
                activeCalls[callId].userSocketId = socket.id;
            } else if (userType === 'doctor') {
                activeCalls[callId].doctorSocketId = socket.id;
            }
        }

        // If both user and doctor are in the call, start timer
        if (activeCalls[callId].userSocketId && activeCalls[callId].doctorSocketId && !activeCalls[callId].timer) {
            activeCalls[callId].startTime = new Date();
            console.log(`Call ${callId} started at ${activeCalls[callId].startTime}`);
            // Update call status in DB to active if not already
            await Call.findByIdAndUpdate(callId, { status: 'active', startTime: activeCalls[callId].startTime });
            io.to(callId).emit('callStarted', { callId, startTime: activeCalls[callId].startTime });
        }
    });

    // WebRTC Signaling
    socket.on('offer', (data) => {
        socket.to(data.callId).emit('offer', data);
    });

    socket.on('answer', (data) => {
        socket.to(data.callId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.callId).emit('ice-candidate', data);
    });

    // Chat during call
    socket.on('chatMessage', ({ callId, sender, message }) => {
        io.to(callId).emit('message', { sender, message, timestamp: new Date() });
    });

    // End call
    socket.on('endCall', async ({ callId }) => {
        if (activeCalls[callId]) {
            const callData = activeCalls[callId];
            const endTime = new Date();
            const durationMs = endTime - callData.startTime;
            const durationMinutes = Math.ceil(durationMs / (1000 * 60));

            const call = await Call.findById(callId);
            if (call) {
                call.endTime = endTime;
                call.duration = durationMinutes;
                // Billing will be handled by the /api/calls/end route
                call.status = 'completed';
                await call.save();
            }

            io.to(callId).emit('callEnded', { callId, duration: durationMinutes });
            delete activeCalls[callId];
            console.log(`Call ${callId} ended.`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle cases where a user disconnects during an active call
        for (const callId in activeCalls) {
            if (activeCalls[callId].userSocketId === socket.id || activeCalls[callId].doctorSocketId === socket.id) {
                console.log(`Participant ${socket.id} disconnected from call ${callId}`);
                // Optionally, emit an event to the other participant that the call has ended
                io.to(callId).emit('participantDisconnected', { disconnectedSocketId: socket.id });
                // The actual billing and call status update will happen when the other participant explicitly ends the call
                // or via a separate cleanup mechanism. For now, just remove from activeCalls.
                delete activeCalls[callId];
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
