const express = require('express');
const router = express.Router();
const User = require('../models/user');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Route to send OTP for order confirmation
router.post('/send-order-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Email is required');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated Order OTP:', otp);

    try {
        await User.updateOne({ email }, { orderOtp: otp, orderOtpExpiry: Date.now() + 5 * 60 * 1000 }, { upsert: true });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Order Confirmation OTP',
            text: `Your OTP code for order confirmation is ${otp}. It is valid for 5 minutes.`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'OTP sent' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).send('Error sending OTP');
    }
});

// Route to verify OTP for order confirmation
router.post('/verify-order-otp', async (req, res) => {
    const { email, otp } = req.body;
    console.log('Request Body:', req.body);
    if (!email || !otp) {
        return res.status(400).send('Email and OTP are required');
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('Email not found');
        }

        if (otp !== user.orderOtp || Date.now() > user.orderOtpExpiry) {
            return res.status(400).send('Invalid or expired OTP');
        }

        // Clear OTP after successful verification
        await User.updateOne({ email }, { orderOtp: null, orderOtpExpiry: null });
        console.log('Order OTP verified');
        res.status(200).send({ message: 'OTP verified' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).send('Error processing request');
    }
});

module.exports = router;
