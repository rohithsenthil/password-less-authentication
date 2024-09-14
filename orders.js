const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid'); // For generating unique order IDs
const nodemailer = require('nodemailer');
const user = require('../models/user');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

router.post('/place-order', async (req, res) => {

    console.log('Request Body:', req.body);
    const { userEmail, cartItems, address, totalAmount } = req.body;

    if (!userEmail || !cartItems || !address || !totalAmount) {
        return res.status(400).send('All fields are required');
    }
    let parsedCartItems;
    try {
        parsedCartItems = JSON.parse(cartItems);
    } catch (error) {
        return res.status(400).send('Invalid cartItems format');
    }
    const orderId = uuidv4(); // Generate unique order ID

    try {
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Save order to user's orders
        user.orders.push({
            orderId,
            cartItems:parsedCartItems,
            address,
            totalAmount
        });

        await user.save();

        // Prepare the email content after saving the order
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Order Confirmation',
            html: `
                <h1>Order Confirmed</h1>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Shipping Address:</strong></p>
                <p>${address.line1}</p>
                <p>${address.city}, ${address.state}</p>
                <p>${address.country} - ${address.pincode}</p>
                <h3>Cart Items</h3>
                ${parsedCartItems.map(item => `
                    <div>
                        <p><strong>Product:</strong> ${item.product.name}</p>
                        <p><strong>Price:</strong> Rs.${item.product.price}.00</p>
                        <p><strong>Quantity:</strong> ${item.quantity}</p>
                    </div>
                `).join('')}
                <p><strong>Total Amount:</strong> Rs.${totalAmount}.00</p>
            `
        };

        // Send email after saving the order
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');

        res.status(200).json({ message: 'Order placed successfully' });
    
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
});



module.exports = router;
