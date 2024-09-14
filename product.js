// models/product.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    rating: { type: String, required: true }, // E.g., "★★★★☆"
    colors: [String], // Array of color hex codes
    offer: { type: String, required: true }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
