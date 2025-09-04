const paymentRouter = require('express').Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const userModel = require('./userModel');
const productModel = require('./productModel')


const addProductToCart = async (req, res) => {
    const { user } = req.body;
    if (!user) {
        return res.status(200).json({
            success: false,
            message: "All fields are required"
        })
    }
    console.log("In cart section");
    res.send("Ok").json({
        message: "ok"
    })
}


const verifyPayment = async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.Razorpay_Key_Secret)
        .update(body.toString())
        .digest('hex');
    if (expectedSignature === razorpay_signature) {
        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id
        });
    } else {
        res.status(200).json({ success: false, message: "Payment verification failed" });
    }
}


const instance = new Razorpay({
    key_id: process.env.Razorpay_Key_ID,
    key_secret: process.env.Razorpay_Key_Secret

})

paymentRouter.post('/create-order', async (req, res) => {
    const { amount, user } = req.body;
    const options = {
        amount: Number(amount * 100),
        currency: 'INR'
    }

    const order = await instance.orders.create(options);
    res.status(200).json({
        success: true,
        order
    })
});


paymentRouter.post('/verifyPayment', verifyPayment);

paymentRouter.post('/toOrder', async (req, res) => {
    const { userId, productId, quantity } = req.body;

    const product = await productModel.findById(productId);
    console.log(product)

    const modelProduct = {
        _id: productId,
        name: product.name,
        category: product.category,
        discription: product.discription,
        price: product.price,
        offerPrice: product.offerPrice,
        imageOne: product.imageOne,
        imageTwo: product.imageTwo,
        imageThree: product.imageThree,
        imageFour: product.imageFour,
        isStock: product.isStock,
        uploadAt: product.uploadAt,
        quantity,
        payment : "Payed",
        status : "On Going",
        date : Date.now()
    }
    //   console.log(modelProduct);


    try {
        
       const user = await userModel.findById(userId);
       user.order.push(modelProduct);

       await user.save();

       res.json({
        success : true,
        message : "Added to order"
       })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
})

paymentRouter.post('/user', async(req, res)=>{
    const {userId} = req.body;
    if(!userId) return res.json({
        success : false,
        message : "User id not found"
    })

    const user = await userModel.findById(userId);
    res.json({
        success : true,
        user
    })
})



// paymentRouter.post('/user-orders', async (req, res) => {
//     const { userId } = req.body;

//     if (!userId) return res.json({
//         success: false,
//         message: "user Id not found"
//     })
//    try{
//      const orders = await orderModel.findOne({ userId });

//     if (!orders) return res.json({
//         success: false,
//         message: "Order Not found"
//     })

//     return res.json({
//         success: true,
//         orders
//     })
//    }catch(error){
//     return res.json({
//         success : false,
//         message : error.message
//     })
//    }
// })



paymentRouter.get('/user-orders', async (req, res) => {
    var users = await userModel.find();
    
    users = users.filter((item)=> item.order[0] != null);

    console.log(users);
    
    return res.json({
        success : true,
        users
    })
})

paymentRouter.post('/status', async(req, res)=>{
    const {value, index, id} = req.body;

    console.log(value, index, id);
    
    if(value  == undefined|| index  == undefined || id == undefined) return res.json({
        success : false,
        message : "All fields are required"
    })


    const user = await userModel.findById(id);
    console.log(user)
    user.order[index].status = value;
    user.markModified('order');

    await user.save();
    res.json({
        success : true,
        user
    })
})


paymentRouter.post('/aiCart', async (req, res) => {
     const { productName, userId, quantity } = req.body;
     // console.log(productId, userId);

     if (productName === '' || userId === '' || quantity === '') return res.status(200).json({
          success: false,
          message: "All fields are required"
     })

     try {
          const product = await productModel.findOne({ name: productName });
          if (!product) return res.status(200).json({
               success: false,
               message: "Product not found"
          })
          const user = await userModel.findById(userId);
          if (!user) return res.status(200).json({
               success: false,
               message: "User not found"
          })

          const productId = product._id;
          const existingCartItem = user.cart.findIndex(item => item.productId.toString() === productId.toString());
          console.log(existingCartItem)
          if (existingCartItem > -1) {
               user.cart[existingCartItem].quantity = Number(user.cart[existingCartItem].quantity) + Number(quantity);
          }
          else {
               user.cart.push({
                    productId: product._id,
                    name: product.name,
                    category: product.category,
                    discription: product.discription,
                    offerPrice: product.offerPrice,
                    price: product.price,
                    imageOne: product.imageOne,
                    imageTwo: product.imageTwo,
                    imageThree: product.imageThree,
                    imageFour: product.imageFour,
                    isStock: product.isStock,
                    quantity : Number(quantity)
               });
          }
          user.markModified('cart');
          await user.save();
          return res.status(200).json({
               success: true,
               message: "Product added to cart successfully",
               user,
               cartItem: user.cart
          })
     } catch (error) {
          res.status(200).json({
               success: false,
               message: error.message
          })
     }
})

paymentRouter.put('/quantity', async(req, res)=>{
        const {userId, index, quantity} = req.body;

        if(userId == undefined || index == undefined || quantity == undefined) return res.json({
            success : false,
            message : "All fields are required"
        })

        const user = await userModel.findById(userId);
        user.cart[index].quantity = quantity;
        user.markModified('cart');
        await user.save();

        res.json({
            success : true,
            user
        })
})

module.exports = paymentRouter;