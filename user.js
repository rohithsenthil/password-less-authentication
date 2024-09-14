const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Address schema for user and order address
const AddressSchema = new mongoose.Schema({
    address1: { type: String },
    address2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String }
});

// Order schema for storing orders in the user schema
const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    cartItems: [
        {
            product: { type: Object },
            quantity: { type: Number}
        }
    ],
    address: {
        line1: String,
        city: String,
        state: String,
        country: String,
        pincode: String
    },
    totalAmount: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});



// User schema including orders and cart
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    address: AddressSchema,
    phone: {
        type: String
    },
    orders: [orderSchema], // Define this as an array of orderSchema objects
    profileCompleted: {
        type: Boolean,
        default: false
    },
    orderOtp: String,
    orderOtpExpiry: Date,
    cart: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
