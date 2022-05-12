const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const env = require('dotenv');
const cors = require('cors');
const port = 3001
env.config();

const mongoose = require('mongoose');
const db = `mongodb+srv://dbUser:dbUser@cluster0.lrk8k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
mongoose.connect(db, { useNewUrlParser: true, }).then(() => console.log('MongoDB connected...')).catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors({
  origin: '*' 
}));

const userRouter = require('./router/userRouter')
app.use('/api',userRouter);

app.get('/get', async (req, res) => {  
  const userWallet = require('./models/userWallet');
  try {
      const limitValue = req.query.limit || 2;
      const skipValue = req.query.skip || 0;
      const walletData = await userWallet.find().limit(limitValue).skip(skipValue).sort({ createdAt: 'desc'});
      res.status(200).send(walletData);
    } catch (e) {
        console.log(e);
    }  
});

app.listen(port, '0.0.0.0' , () => {
    console.log(`App listening at http://localhost:${port}`);
});



async function requireSignin(req, res, next) { 
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const user = jwt.verify(token, process.env.JWT_SECRET);
      req.user = user;
       next();  
    } else {
      return res.status(400).json({ message: "Authorization required" });
    }
    //jwt.decode()
  };
   




/**
 
const jwt = require('jsonwebtoken')

exports.requireSignin = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } else {
    return res.status(400).json({ message: "Authorization required" });
  }
  //jwt.decode()
};
 
 */