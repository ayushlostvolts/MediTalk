const express = require('express');
const Stripe = require('stripe');
const Call = require('../models/Call');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create a Stripe Payment Intent
// @route   POST /api/payments/create-payment-intent
// @access  Private (User only)
router.post('/create-payment-intent', protect, async (req, res) => {
    const { amount } = req.body; // amount in cents
    try {
        const paymentIntent = await stripe.paymentIntIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card'],
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Process payment after call ends
// @route   POST /api/payments/process-call-payment
// @access  Private (Backend initiated, or authorized user/doctor)
router.post('/process-call-payment', protect, async (req, res) => {
    const { callId } = req.body;

    try {
        const call = await Call.findById(callId).populate('doctor');

        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }
        if (call.status !== 'completed' || call.billAmount <= 0) {
            return res.status(400).json({ message: 'Call not completed or no bill amount' });
        }
        if (call.stripeChargeId) {
            return res.status(400).json({ message: 'Payment already processed for this call' });
        }

        // In a real application, you would fetch the user's saved payment method
        // For simplicity, this example assumes a payment method token is provided or a default is used.
        // This endpoint would typically be called by the backend after a call ends,
        // or by the frontend with a payment method from the user.
        // For now, we'll simulate a direct charge.
        // A more robust solution would involve Payment Intents and confirming on the client.

        // For demonstration, let's assume we have a customer and a payment method
        // This part needs to be properly integrated with Stripe's client-side setup
        // and saving customer payment methods.
        // For now, we'll just return a success message.
        // In a real scenario, you'd use paymentIntent.confirm() or create a charge.

        // Example: Create a charge (less recommended for new integrations, Payment Intents are better)
        // const paymentIntent = await stripe.paymentIntents.create({
        //     amount: Math.round(call.billAmount * 100), // amount in cents
        //     currency: 'usd',
        //     customer: 'cus_xxxxxxxxxxxxxx', // Replace with actual customer ID
        //     payment_method: 'pm_card_visa', // Replace with actual payment method ID
        //     off_session: true,
        //     confirm: true,
        // });

        // call.stripeChargeId = paymentIntent.id;
        // await call.save();

        res.json({ message: 'Payment processing simulated successfully. Implement actual Stripe charge here.', callId: call._id, billAmount: call.billAmount });

    } catch (error) {
        console.error('Stripe payment error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
