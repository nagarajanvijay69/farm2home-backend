const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
     order : {
          type : []
     },
     
})

const orderModel = mongoose.model('orderModel', orderSchema);


module.exports = orderModel;