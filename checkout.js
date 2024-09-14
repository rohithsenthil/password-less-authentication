const express = require('express');
const router = express.Router();
const Cart = require('../models/cart'); // Assuming you have a Cart model
const User = require('../models/user'); // Assuming you have a User model

router.get('/checkout', async (req, res) => {
    const userEmail = req.session.email;

    if (!userEmail) {
        return res.redirect('/login');
    }

    try {
        // Fetch user details
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Fetch cart items and calculate total amount
        const cartItems = await Cart.find({ userEmail });
        const totalAmount = cartItems.reduce((total, item) => total + (item.quantity * item.price), 0);

        res.render('checkout', {
            user,
            cartItems,
            totalAmount // Make sure this is passed to the EJS template
        });
    } catch (error) {
        console.error('Error fetching checkout data:', error);
        res.status(500).send('Error fetching checkout data');
    }
});

module.exports = router;
