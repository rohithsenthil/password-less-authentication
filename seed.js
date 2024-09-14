const mongoose = require('mongoose');
const Product = require('./models/product'); // Adjust the path as needed

// Connect to your MongoDB database
mongoose.connect('mongodb://localhost/ecommerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    
    // Define the products
    const products = [
        {
            name: 'Saree',
            price: 699.00,
            rating: 4.0,
            image: 'saree3.avif',
            colors: ['#e74c3c', '#3498db', '#2ecc71'],
            offer: 'Limited time offer: Save 20%!'
        },
        {
            name: 'Stylish Jacket',
            price: 400.00,
            rating: 4.0,
            image: 'mens jacket.1.jpg',
            colors: ['#34495e', '#95a5a6'],
            offer: 'Special Offer: Buy 2 Get 1 Free!'
        },
        {
            name: 'Trendy Tops',
            price: 320.00,
            rating: 5.0,
            image: 'tops.1.jpg',
            colors: ['#9b59b6', '#8e44ad'],
            offer: 'Exclusive Discount: 30% Off!'
        },
        {
            name: 'Casual Shirt',
            price: 299.00,
            rating: 4.0,
            image: 'causal shirts.1.webp',
            colors: ['#1abc9c', '#16a085'],
            offer: 'Discount: 10% Off!'
        },
        {
            name: 'Trendy Jeans',
            price: 499.00,
            rating: 4.0,
            image: 'jeans.1..jpeg',
            colors: ['#2980b9', '#3498db'],
            offer: 'Buy 1 Get 1 Free!'
        },
        {
            name: 'Modern Sunglasses',
            price: 89.00,
            rating: 4.0,
            image: 'sunglasses.1..webp',
            colors: ['#34495e', '#95a5a6'],
            offer: 'Special Offer: Buy 2 Get 1 Free!'
        }
    ];

    // Clear existing products and insert new ones
    Product.deleteMany({}).then(() => {
        return Product.insertMany(products);
    }).then(() => {
        console.log('Products seeded successfully');
        mongoose.connection.close();
    }).catch(err => {
        console.error('Error seeding products:', err);
        mongoose.connection.close();
    });
});
