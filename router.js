const express = require('express');
const userModel = require('./userModel');
const productModel = require('./productModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const mailer = require('nodemailer');
const upload = require('./cloudinary/multer');
const cloudinary = require('./cloudinary/cloudinary');
const orderModel = require('./orderModel');

const router = express.Router();


router.get('/', async (req, res) => {
     res.send("Api Working");
})

router.get('/ping', async(req, res)=>{
     res.status(200).send("This is Check API");
})


// Authentication API

router.get('/admin-login', async (req, res) => {
     const { email, password } = req.body;
     try {
          if (!email.trim() || !password.trim()) return res.status(404).json({
               success: false,
               message: "All Fields are required"
          })

          if (email === 'adminemail123@gmail.com' && password === 'adminpassword123@') {
               return res.status(200).json({
                    success: true,
                    message: 'Admin Logged in Successfully'
               })
          } else {
               return res.status(200).json({
                    success: false,
                    message: 'Incorrect Email or Password'
               })
          }
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error
          })
     }
})





router.post('/signup', async (req, res) => {
     const { username, email, password } = req.body;
     if (!username.trim() || !email.trim() || !password.trim())
          return res.status(404).json({
               message: "required all fields",
               success: false
          })
     const checkUser = await userModel.find({ email });

     if (checkUser.length > 0) {
          console.log("user", checkUser);
          return res.status(200).json({
               success: false,
               message: 'User Already Exist'
          })
     }

     try {
          const hashPassword = await bcrypt.hash(password, 10);
          const token = jwt.sign({ email }, process.env.SECRET_Key, { expiresIn: '1h' });

          const user = new userModel({
               username,
               email,
               password: hashPassword
          });


          await user.save();
          return res.cookie("token", token, {
               maxAge: 30 * 24 * 60 * 60 * 1000,
               httpOnly: true,
               secure: false,
               sameSite: 'Lax'
          }).json({
               success: true,
               message: 'User Created Successfully',
               user
          })
     } catch (err) {
          res.status(500).json({
               success: false,
               message: err
          })
     }
})

router.post('/login', async (req, res) => {
     console.log("Pass")
     const { email, password } = req.body;

     if (!email.trim() || !password.trim())
          return res.status(404).json({
               message: "required all fields",
               success: false
          })

     try {
          const user = await userModel.findOne({ email });
          console.log(user);
          if (!user) {
               return res.status(200).json({
                    success: false,
                    message: 'User Not Found'
               })
          }

          const verifyPassword = await bcrypt.compare(password, user.password);
          console.log(verifyPassword);
          if (!verifyPassword)
               return res.status(200).json({
                    success: false,
                    message: "wrong Password"
               })


          const token = jwt.sign({ email }, process.env.SECRET_Key, { expiresIn: '30d' });

          return res.cookie("token", token, {
               maxAge: 30 * 24 * 60 * 60 * 1000,
               httpOnly: true,
               secure: false,
               sameSite: 'Lax'
          }).json({
               success: true,
               message: 'User Login Successfully',
               user
          })
     } catch (error) {
          console.log(error);
          res.status(200).json({
               success: false,
               error: error.message
          })
     }
})

router.get('/logout', async (req, res) => {
     return res.clearCookie('token',).json({
          success: true,
          message: "Logout Succesfully"
     })
})

router.get('/token', async (req, res) => {
     const token = req.cookies.token;
     console.log("token " + token)

     if (!token) return res.status(404).json({
          success: false,
          message: "Token Not Found"
     })

     try {
          const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
          console.log("Verify Token " + verifyToken)

          if (!verifyToken) return res.status(401).json({
               success: false,
               message: "Invalid token or Token has been expiryed"
          })
          const email = verifyToken.email
          const user = await userModel.findOne({ email });

          return res.status(200).json({
               success: true,
               message: "Login succesfully throught token",
               user
          })
     } catch (error) {
          res.status(200).json({
               message: error,
               success: false
          })
     }
})

router.patch('/reset', async (req, res) => {
     const { email, newPassword } = req.body;
     if (!email) return res.status(404).json({
          success: false,
          message: "Email Not found"
     })

     try {
          const user = await userModel.findOne({ email });

          if (!user) return res.status(200).json({
               success: false,
               message: "User Not found"
          })
          const hashPassword = await bcrypt.hash(newPassword, 10);
          user.password = hashPassword;
          await user.save();

          const token = jwt.sign({ email }, process.env.SECRET_Key, { expiresIn: '30d' });

          res.cookie("token", token, {
               maxAge: 30 * 24 * 60 * 60 * 1000,
               httpOnly: true,
               secure: false,
               sameSite: 'Lax'
          });
          return res.status(200).json({
               success: true,
               message: "Reset Password Successfully",
               user
          })
     } catch (error) {
          res.status(200).json({
               success: false,
               message: error.message
          })
     }

})


router.post('/check-email', async (req, res) => {
     const { email } = req.body;
     if (!email) return res.status(404).json({
          success: false,
          message: "Email not found"
     })

     try {
          const user = await userModel.findOne({ email });
          if (!user) return res.status(200).json({
               success: false,
               message: "User Not Found",
               user
          })

          return res.status(200).json({
               success: true,
               message: "User Found"
          })
     } catch (error) {
          res.status(500).json({
               message: error.message,
               success: false
          })
     }
})


router.post('/mail', async (req, res) => {
     const { email } = req.body;

     if (!email) return res.status(404).json({
          success: true,
          message: "Email not found"
     })

     try {
          const transporter = mailer.createTransport({
               service: 'gmail',
               secure: false,
               auth: {
                    user: 'nagarajanvijay46@gmail.com',
                    pass: 'gpvm eved fovd lrbp'
               }
          })

          const htmlTemplate = `
        <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>OTP Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f3f4f6;
        margin: 0;
        padding: 0;
      }
      .email-container {
        max-width: 500px;
        margin: 30px auto;
        background-color: #ffffff;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        color: #333;
      }
      .email-header {
        text-align: center;
        margin-bottom: 20px;
      }
      .email-header h2 {
        color: #2563eb;
      }
      .otp-box {
        font-size: 28px;
        font-weight: bold;
        color: #1d4ed8;
        background-color: #e0f2fe;
        padding: 10px 20px;
        display: inline-block;
        border-radius: 8px;
        margin: 20px 0;
      }
      .email-footer {
        font-size: 12px;
        color: #777;
        text-align: center;
        margin-top: 30px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <h2>OTP Verification</h2>
        <p>Please use the following One-Time Password (OTP) to continue your request:</p>
      </div>
      <div style="text-align: center;">
        <div class="otp-box">{{otp}}</div>
      </div>
      <p style="text-align: center;">This code will expire in 30 min, Do not share it with anyone.</p>
      <div class="email-footer">
        If you didn't sign up, please ignore this email.<br />
        &copy; 2025 Farm to Home
      </div>
    </div>
  </body>
</html>
     `
          const otp = Math.floor(Math.random() * 9000);
          const mailHtml = htmlTemplate.replace('{{otp}}', otp);

          const option = {
               from: 'nagarajanvijay46@gmail.com',
               to: email,
               subject: "verification OTP",
               html: mailHtml
          }

          console.log(email);
          console.log(Number(otp));
          await transporter.sendMail(option);

          transporter.verify((error, success) => {
               if (error) console.log(error);
               else console.log("Server ready");
          })

          res.status(200).json({
               success: true,
               message: "OTP send successfully",
               otp
          })
     } catch (error) {
          res.status(200).json({
               message: error,
               success: false
          })
     }
})


// Products API

router.post('/add-product', upload.array('productImage', 4), async (req, res) => {
     const productData = JSON.parse(req.body.productData)
     console.log(productData, req.files)

     // if (!name.trim() || !category.trim() || !discription.trim() || !price.trim() || !offerPrice.trim())
     //      return res.status(404).json({
     //           success: false,
     //           message: 'All fields are required'
     //      })

     try {
          const imgURL = [];
          for (const file of req.files) {
               const baseData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
               const result = await cloudinary.uploader.upload(baseData, {
                    resource_type: 'image'
               })
               imgURL.push(result.secure_url);
          }

          const product = new productModel({
               name : productData.name,
               category : productData.category,
               discription : productData.discription,
               price : productData.price,
               offerPrice : productData.offerPrice,
               imageOne: imgURL[0],
               imageTwo: imgURL[1],
               imageThree: imgURL[2],
               imageFour: imgURL[3],

          })
          await product.save();
          const products = await productModel.find();
          res.status(201).json({
               success: true,
               message: "Product created",
               products
          });

     }
     catch (error) {
          res.status(200).json({
               success: false,
               message: error
          })
     }

})

router.put('/update', async (req, res) => {
     const { id, name, category, discription, price, offerPrice, isStock, productImage } = req.body;
     try {
          await productModel.findByIdAndUpdate(id, { name, category, discription, price, offerPrice, productImage, isStock });
          const products = await productModel.find();
          res.status(200).json({
               success: true,
               message: "Product updated successfully",
               products
          })
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          })
     }
})

// router.delete('/delete', async (req, res) => {
//      const { productId } = req.body;
//      if (!productId) return res.status(404).json({
//           success: false,
//           message: "Product id not found"
//      })
//      try {
//           await productModel.findByIdAndDelete(productId);
//           res.status(200).json({
//                success: true,
//                message: "Product deleted Successfully"
//           })
//      } catch (error) {
//           res.status(500).json({
//                success: false,
//                message: error.message
//           })
//      }
// })

router.get('/getproducts', async (req, res) => {
     try {
          const products = await productModel.find();
          return res.status(200).json({
               success: true,
               products
          })
     } catch (error) {
          res.status(200).json({
               success: false,
               message: error.message
          })
     }
})

router.post('/addCart', async (req, res) => {
     const { productId, userId } = req.body;
     // console.log(productId, userId);

     if (productId === '' || userId === '') return res.status(200).json({
          success: false,
          message: "All fields are required"
     })

     try {
          const product = await productModel.findById(productId);
          if (!product) return res.status(200).json({
               success: false,
               message: "Product not found"
          })
          const user = await userModel.findById(userId);
          if (!user) return res.status(200).json({
               success: false,
               message: "User not found"
          })


          const existingCartItem = user.cart.findIndex(item => item.productId.toString() === productId);

          if (existingCartItem > -1) {
               user.cart[existingCartItem].quantity += 1;
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
                    quantity: 1
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


router.post('/emptyCart', async (req, res) => {
     const { userId } = req.body;
     console.log(userId)
     if(!userId) return res.json({
          success : false,
          message : "userId not found"
     })
     const user = await userModel.findById(userId);
     console.log(user)
     user.cart = user.cart.filter((item => item.productId != item.productId))
     user.markModified('cart');
     await user.save();
     return res.json({
          success: true,
          message: "Cart becomes Empty"
     })
})
router.post('/removeCart', async (req, res) => {
     const { productId, userId } = req.body;
     if (productId === '' || userId === '') return res.status(200).json({
          success: false,
          message: "All fields are required"
     })
     try {
          const user = await userModel.findById(userId);
          if (!user) return res.status(200).json({
               success: false,
               message: "User not found"
          })


          const productIndex = user.cart.findIndex(item => item.productId.toString() === productId);
          if (productIndex < 0) return res.status(200).json({
               success: false,
               message: "Invalid id"
          })

          user.cart.splice(productIndex, 1);
          user.markModified('cart');
          await user.save();

          return res.status(200).json({
               success: true,
               message: "Product removed from cart",
               cartItem: user.cart
          })
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          })
     }
})


router.post('/deleteProduct', async(req, res)=>{
     const {id} = req.body;
     console.log(id);
     
     const product = await productModel.findByIdAndDelete(id);
     const products = await productModel.find();
     return res.json({
          success : true,
          message : "Product Deleted",
          products
     })
})


router.post('/address', async(req, res)=>{
     const {address, userId} = req.body;

     if(!address || !userId) return res.json({
          success : false,
          message : "All fields are required"
     })

     const user = await userModel.findById(userId);
     user.address = address;

     await user.save();
     res.json({
          success : true,
          message : "Address Saved Successfully",
          user
     })


})

router.post('/order', async(req, res)=>{
     const {userId} = req.body;

     if(!userId) return res.json({
          success : false,
          message : "UserId not found"
     })

     const user = await userModel.findById(userId);
     for(let i = 0; i < user.cart.length; i++){
          user.order = user.order.push(user.cart[i])
     }

     await user.save();
     res.json({
          success : true,
          message : "Saved"
     })
})



module.exports = router;