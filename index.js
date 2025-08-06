const express = require('express');
const cors = require('cors');
const userRouter = require('./router');
const { default: mongoose } = require('mongoose');
const cookie = require('cookie-parser');
const dotenv = require('dotenv').config();
const paymentRouter = require('./paymentRoutes');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie());
app.use(cors());

mongoose.connect('mongodb+srv://nagarajanvijay69:nagarajanvijay...@cluster0.vcydudb.mongodb.net/data')
   .then((res) => {
      console.log("Data Base Connected");
   }).catch((err) => {
      console.error("Error Message : ", err);
   })

app.use('/', userRouter);
app.use('/', paymentRouter);

app.listen(8000, () => {
   console.log("Server Running");

})

