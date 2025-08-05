const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    cart: {
        type: Array,
        default: []
    },
    address: {
        type: Array,
        default: []
    },
    order: {
        type: Array,
        default: []
    }
})

const userModel = mongoose.model('userModel', userSchema);

module.exports = userModel;
