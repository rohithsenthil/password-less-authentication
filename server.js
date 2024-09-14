const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const User = require('./models/user'); // Assuming the User model is defined
const Product = require('./models/product');
const authRoutes = require('./routes/auth');
const app = express();
const bodyParser = require('body-parser');
const orderAuthRoutes = require('./routes/order-auth');
const orderRoutes = require('./routes/orders');
require('dotenv').config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));
 
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const flash = require('connect-flash');
app.use(flash());



// Session management
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
}));
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    next();
});
// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Home route with user info and profile check
// Home route with user info and profile check
app.get('/', async (req, res) => {

    const email = req.session.email; // Retrieve user email from session
  
    if (!email) {
      return res.redirect('/auth/login'); // Redirect to login if not logged in
    }
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.redirect('/auth/login'); // Redirect to login if user not found
      }
  
      const profileCompleted = user.name && user.address && user.phone; // Check if profile is complete
      // Fetch products from database
      const products = await Product.find();
        
      // Render the index page with user info and profile completion status
      res.render('index', { 
        email: user.email, 
        name: user.name || null, 
        profileCompleted,
        products, 
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

// Profile route for users to update their profile
app.get('/complete-profile', (req, res) => {
  const email = req.session.email;
  if (!email) {
    return res.redirect('/auth/login');
  }
  res.render('complete-profile', { email });
});

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/complete-profile', async (req, res) => {
    const { name, address1, address2, city, state, country, pincode, phone } = req.body;
    const email = req.session.email;

    if (!email) {
        return res.redirect('/auth/login');
    }

    // Basic validation
    if (!name || !address1 || !city || !state || !country || !pincode || !phone) {
        return res.status(400).send('All required fields must be filled out.');
    }

    // Validate pincode (6 digits)
    const pincodePattern = /^\d{6}$/;
    if (!pincodePattern.test(pincode)) {
        return res.status(400).send('Pincode must be 6 digits.');
    }

    // Validate phone number (Country code +10 digits)
    const phonePattern = /^\+\d{1,3}\d{10}$/;
    if (!phonePattern.test(phone)) {
        return res.status(400).send('Phone number must include country code and be followed by 10 digits.');
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        user.name = name;
        user.address = {
            address1,
            address2,
            city,
            state,
            country,
            pincode
        };
        user.phone = phone;

        await user.save();
        res.redirect('/'); // Redirect to a success page or dashboard
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/cart', async (req, res) => {
    const email = req.session.email;
    const name = req.session.name;
    if (!email) {
      return res.redirect('/auth/login');
    }
  
    try {
      const user = await User.findOne({ email }).populate('cart.productId');
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      const cartItems = user.cart.map(item => ({
        product: item.productId,
        quantity: item.quantity
      }));
  
      res.render('cart', { user: user.email, user,name, cartItems });
    } catch (error) {
      console.error('Error fetching cart data:', error);
      res.status(500).send('Internal Server Error');
    }
  });


  app.post('/cart/add', async (req, res) => {
    const email = req.session.email;
    const productId = req.body.productId;

    if (!email) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const existingItem = user.cart.find(item => item.productId.toString() === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.cart.push({ productId, quantity: 1 });
        }

        await user.save();
        req.flash('success', 'Product added to cart successfully!');
        res.redirect('/');
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Update cart item quantity
app.post('/cart/update', async (req, res) => {
    const email = req.session.email;
    const { productId, action } = req.body;

    if (!email) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const itemIndex = user.cart.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            if (action === 'increase') {
                user.cart[itemIndex].quantity += 1;
            } else if (action === 'decrease') {
                if (user.cart[itemIndex].quantity > 1) {
                    user.cart[itemIndex].quantity -= 1;
                } else {
                    user.cart.splice(itemIndex, 1);
                }
            }
        }

        await user.save();
        res.redirect('/cart');
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/cart/remove', async (req, res) => {
    const email = req.session.email;
    const { productId } = req.body;

    if (!email) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        user.cart = user.cart.filter(item => item.productId.toString() !== productId);

        await user.save();
        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Display order confirmation page
app.get('/checkout', async (req, res) => {
    const email = req.session.email;

    if (!email) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findOne({ email }).populate('cart.productId');

        if (!user) {
            return res.status(404).send('User not found');
        }

        const cartItems = user.cart.map(item => ({
            product: {
                name: item.productId.name || 'Unnamed Product',
                price: item.productId.price || 0,
                image: item.productId.image || 'default-image.jpg'
            },
            quantity: item.quantity || 0
        }));

        res.render('checkout', {
            user: {
                name: user.name || 'Unknown',
                email: user.email || 'Not Provided',
                phone: user.phone || 'Not Provided',
                address: user.address || {
                    line1: '',
                    city: '',
                    state: '',
                    country: '',
                    pincode: ''
                }
            },
            cartItems: cartItems
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});




// Update address
app.post('/checkout', async (req, res) => {
    const email = req.session.email;
    const { address, action } = req.body;

    if (!email) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (action === 'update-address') {
            user.address = address;
            await user.save();
            res.redirect('/checkout');
        } else if (action === 'place-order') {
            // Handle order placement
            // For simplicity, just clear the cart and save order details
            user.cart = [];
            await user.save();
            res.send('Order placed successfully!');
        }
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/checkout', async (req, res) => {
    try {
        // Fetch cart items for the user
        const cartItems = await getCartItemsForUser(req.user.email);
        
        // Calculate total amount
        let totalAmount = 0;
        cartItems.forEach(item => {
            totalAmount += item.product.price * item.quantity;
        });

        // Render checkout page with necessary data
        res.render('checkout', {
            user: req.user,
            cartItems: cartItems,
            totalAmount: totalAmountt // Ensure this value is passed
        });
    } catch (error) {
        console.error('Error fetching checkout data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Logout route
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
    }
    res.redirect('/auth/login');
  });
});


app.get('/my-orders', async (req, res) => {
    const userEmail = req.session.email; // Assuming email is stored in session

    if (!userEmail) {
        return res.status(400).send('Email is required');
    }

    try {
        const user = await User.findOne({ email: userEmail }).populate('orders'); // Adjust if necessary
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('my-orders', { user: user, orders: user.orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
});

// Auth routes
app.use('/auth', authRoutes);

app.use('/order-auth', orderAuthRoutes);

app.use('/orders', orderRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
