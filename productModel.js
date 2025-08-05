const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
     name: {
          type: String,
          required: true
     },
     category: {
          type: String,
          required: true
     },
     discription: {
          type: String,
          required: true
     },
     price: {
          type: Number,
          required: true
     },
     offerPrice: {
          type: Number,
          required: true
     },
     imageOne: {
          type: String,
          required: true
     },
     imageTwo: {
          type: String,
          default: ''
     },
     imageThree: {
          type: String,
          default: ''
     },
     imageFour: {
          type: String,
          default: ''
     },
     isStock: {
          type: Boolean,
          default: true
     },
     uploadAt: {
          type: Date,
          default: Date.now
     }
});




const productModel = mongoose.model('productModel', productSchema);

module.exports = productModel