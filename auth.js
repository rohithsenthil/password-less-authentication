const express = require('express');
const router = express.Router();
const User = require('../models/user');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
require('dotenv').config();

// Render the login page
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
}); 

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


router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Email is required');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();


    console.log('Generated OTP:', otp);

    try {
        await User.updateOne({ email }, { otp, otpExpiry: Date.now() + 5 * 60 * 1000 }, { upsert: true });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'OTP sent'});
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).send('Error sending OTP');
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    console.log(otp);
    console.log("Current Time:", Date.now());
    
    if (!email || !otp) {
      return res.status(400).send('Email and OTP are required');
    }
  
    try {
      // Find user in the database
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'Email not found', requireName: true }); // Existing logic
        
    }
  
      // Check OTP validity
      if (otp !== user.otp || Date.now() > user.otpExpiry) {
        return res.status(400).send('Invalid or expired OTP');
      }
  
    //   // **New Logic for Profile Completion Check:**
    //   if (!user.name) { // Check if name is present (assuming name indicates complete profile)
    //     return res.status(401).json({ message: 'Profile incomplete. Please complete your profile before login.' });
    //   }
  
      // Clear OTP after successful verification
      await User.updateOne({ email }, { otp: null, otpExpiry: null });
  
      console.log('User logged in:', user);
      req.session.email = user.email;
      res.status(200).send({ message: 'Logged in' }); // Successful login
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).send('Error processing request');
    }
  });
  

 
  // Middleware to ensure user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.email) {
      return next();
    }
    res.redirect('/auth/login');
  }
  
  // Update Profile Route
  router.post('/complete-profile', isAuthenticated, async (req, res) => {
    const { name, address, phone } = req.body;
    const email = req.session.email;
  
    if (!name) {
      return res.status(400).render('complete-profile', { message: 'Name is required', error: true });
    }
  
    try {
      const user = await User.findOneAndUpdate(
        { email },
        { name, address, phone },
        { new: true }
      );
  
      if (user) {
        // Profile updated successfully
        res.redirect('/');
      } else {
        // Handle case where user is not found
        res.status(404).render('complete-profile', { message: 'User not found', error: true });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).render('complete-profile', { message: 'Error updating profile', error: true });
    }
  });
  

module.exports = router;