const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Bonus = require('../models/referral_percent');
const Login = require('../models/login_history');
const User = require('../models/user');
const mongoose = require("mongoose");
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

exports.updatePrecent = async (req, res) => {
// var db = mongoose.connection;
// var Percent = db.collection('referral_percents');
// const _userbuy = Bonus.insertMany([{
//     buying_bonus : 5,
//     level1:5,
//     level2:3,
//     level3:2,
// }]).
console.log(req.body.level1);
user_purchase = await Bonus.updateOne({
    _id: '626240cf8a17a3b5fbf6dd43'
}, {
    $set :{
        buying_bonus:req.body.buying,
        level1:req.body.level1,
        level2:req.body.level2,
        level3:req.body.level3,
    }
   }
)

if(user_purchase){
    return res.status(200).json({
        status : "true",
        message : "Data Has been Updated"  
    });
} else {
    return res.status(400).json({
        status : "false",
        message : "Error While Updating Data"  
    });
}
console.log(user_purchase);
}

exports.loginhistory = async (req, res) => { 
    // const {per_page,page} = req.query
    const user = await Login.find({email:req.body.email}).sort( { createdAt: -1 } ).limit(10);
    // console.log(user,"user")
    
      res.status(200).json({login_record:user});
}

exports.levels = async (req, res) => { 
    const refids = [];
    let ref_id=req.body.referral;
    for(let i=0;i<10;i++){
let rid = await User.findOne({  user_id : ref_id});
if(rid){
    refids[i]={userID: rid.user_id,email:rid.email,isverify:rid.isVarify,level:i+1};
    ref_id=rid.refferal;
}
    }
    console.log(refids)
    res.status(200).json({level_list:refids});
}

exports.incomeFromLevels = async (req, res) => { 
    const refids = [];
    let ref_id=req.body.referral;
    for(let i=0;i<10;i++){
let rid = await User.findOne({  user_id : ref_id});
if(rid){
    refids[i]={userID: rid.user_id,email:rid.email,isverify:rid.isVarify,level:i+1};
    ref_id=rid.refferal;
}
    }
    console.log(refids)
    res.status(200).json({level_list:refids});
}