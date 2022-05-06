
const { find } = require("../models/userWallet");
const { mul, sub, add } = require("../utils/Math");
const mongoose = require("mongoose");
const User = require('../models/user');
const Buy = require('../models/buy');
const Bonus = require('../models/referral_percent');

async function getCMCData(base_currency=false, currency=false) {
  try {
    const query_coin_symbol_array = [
      "btc",
      "eth",
      "trx",
      "usdt",
      "busd",
      "shib",
      "bnb",
      "matic",
      "sol",
    ];
    var coin_symbols = base_currency ? base_currency : query_coin_symbol_array.join(",");
    var conver_currency = currency ? currency :"usd";
    const final_third_party_api_url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coin_symbols}&convert=${conver_currency}`;
    const axios = require("axios");
    const ress = await axios.get(final_third_party_api_url, {
      headers: {
        "Content-Type": "Application/json",
        // "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API_KEY
        "X-CMC_PRO_API_KEY": "024d5931-52b8-4c1f-8d99-3928fd987163",
        "Access-Control-Allow-Origin": "*",
      },
    });
    console.log(ress.data.data);
    return ress.data.data;
  } catch (error) {
    return false;
  }
}
exports.createOrder = async (req, res)=> {
    const wallet = require("../models/userWallet");
    try {
      const { amount, currencyType, compairCurrency, email } = req.body;
      let quantity=req.body.raw_price;
      console.log( req.body)
      const  walletData =  await wallet.find({email: email,symbol: { $in:[currencyType, compairCurrency ]}})
        const currencyT = walletData.find((wall => wall.symbol == currencyType ))
        const compairC = walletData.find((wall => wall.symbol == compairCurrency ))
        req.body.currency="inr";
        req.body.base_currency=req.body.currencyType.toLowerCase();
        const cmcdata = await getCMCData(req.body.base_currency,req.body.currency);
        const price_in_inr = cmcdata.TRX.quote.INR.price;
        

        const ANA_price =10;
        const one_ANA_in=ANA_price/price_in_inr;
        let compairVal = mul(one_ANA_in,quantity);
        console.log(req.body)
        if(currencyT.balance >= compairVal ) {
          
                let CTbalance = sub(currencyT.balance, compairVal) > 0 ?sub(currencyT.balance, compairVal):0; 
                let CCbalance = add(compairC.balance, compairVal);
                await wallet.updateOne({_id:currencyT._id},{
                    $set:{
                        balance:CTbalance
                    }
                })
                await wallet.updateOne({_id:compairC._id},{
                    $set:{
                        balance:CCbalance
                    }
                })
                await OrderHistory(compairVal,  one_ANA_in,quantity,  currencyType,  compairCurrency,  email)
                // referral commission
                await  User.findOne({ email :email })
          .exec(async (error, user) => {
              if (user){ 
                req.body.token_quantity=quantity;
                req.body.token_price=ANA_price;
                var db = mongoose.connection;
                //var Percent = db.collection('referral_percents');
                const token_buying = req.body.token_quantity
                const token_price = req.body.token_price
                const token_quantity = token_buying*token_price

                const percnt = await Bonus.findOne();
                console.log(percnt.buying_bonus);
                const bonus_perc = parseInt(percnt.buying_bonus)
                const lev1 = parseInt(percnt.level1)
                const lev2 = parseInt(percnt.level2)
                const lev3 = parseInt(percnt.level3)
                const buying_bonus = (bonus_perc/100) * token_quantity;
                const token_balance = token_quantity
                let referral1 = user.refferal;
                let ref1 = (lev1/100) * token_quantity;
                let ref2 = "";
                let ref3 = "";
                let referral2="";
                let referral3="";
                let refuser1="";
                let refuser2="";
                let refuser3="";
                // get referral ids 
               
                    let rid = await User.findOne({  my_referral_code : referral1 });
                    if(rid){
                        refuser1= rid.email
                        referral2=rid.refferal
                        ref2 = (lev2/100) * token_quantity;
                        let ridi = await User.findOne({  my_referral_code : referral2 });
                           if(ridi){
                          refuser2= ridi.email
                               referral3=ridi.refferal
                               ref3 = (lev3/100) * token_quantity;
                             let ridim = await User.findOne({  my_referral_code : referral3 });
                             if(ridim){
                                refuser3= ridim.email
                              }
                           }
                    }
           
               
                user_purchase = await User.updateOne({
                    email: req.body.email
                }, {
                    $set: {
                      
                    },
                    $inc: {
                        buying_bonus: buying_bonus,
                        token_balance:  token_balance
                    }
                }
    
                ).then(async (d) => {
                    const _userbuy = Buy.insertMany([{
                        email : req.body.email, 
                        token_price : req.body.token_price,
                        token_buying : req.body.token_quantity,
                        token_quantity : token_quantity,
                        bonus_percent : bonus_perc,
                        currency : currencyType,
                        bonus_type : "Buying"
                    }]).then((result)=>{
                        if(referral1 && refuser1){
                            const _userref1 = Buy.insertMany([{
                                email : refuser1, 
                                token_price : req.body.token_price,
                                token_buying : req.body.token_quantity,
                                token_quantity : token_quantity,
                                bonus_type : "Level",
                                from_user : req.body.email,
                                bonus : ref1,
                                bonus_percent : lev1,
                                from_level:1,
                                currency : currencyType
                            }]).then(async (de) => {
                                user_purchase = await User.updateOne({
                                    email: refuser1
                                }, {
                                    $set: {
                                      
                                    },
                                    $inc: {
                                        referral_bonus: ref1
                                    }
                                }
                    
                                )
                            }).catch((error)=>{
                                console.log(error)
                                });
                            }
                            if(referral2 && refuser2){
                                const _userref2 =  Buy.insertMany([{
                                    email : refuser2, 
                                    token_price : req.body.token_price,
                                    token_buying : req.body.token_quantity,
                                    token_quantity : token_quantity,
                                    bonus_type : "Level",
                                    from_user : req.body.email,
                                    bonus : ref2,
                                    bonus_percent : lev2,
                                    from_level:2,
                                    currency : currencyType
                                }]).then(async (te) => {
                                    user_purchase = await User.updateOne({
                                        email: refuser2
                                    }, {
                                        $set: {
                                          
                                        },
                                        $inc: {
                                            referral_bonus: ref2
                                        }
                                    }
                        
                                    )
                                }).catch((error)=>{
                                    console.log(error)
                                    });
                                }
                            if(referral3 && refuser3){
                                    const _userref3 = Buy.insertMany([{
                                        email : refuser3, 
                                        token_price : req.body.token_price,
                                        token_buying : req.body.token_quantity,
                                        token_quantity : token_quantity,
                                        bonus_type : "Level",
                                        from_user : req.body.email,
                                        bonus : ref3,
                                        bonus_percent : lev3,
                                        from_level:3,
                                        currency : currencyType
                                    }]).then(async (ke) => {
                                        user_purchase = await User.updateOne({
                                            email: refuser3
                                        }, {
                                            $set: {
                                              
                                            },
                                            $inc: {
                                                referral_bonus: ref3
                                            }
                                        }
                            
                                        )
                                    }).catch((error)=>{
                                        console.log("error_yaha_hai : ",error)
                                        });
                                }

                                if(result){
                                    return res.status(200).json({
                                        status : "true",
                                        message: "Purchase of Token Quantiy "+token_quantity+" at the price of "+token_price+" is Successfull"
                                    }); 
                                }
                    }).catch((error)=>{
                    console.log(error)
                    });
                    
                    
                  });
              }else{ 
                return res.status(400).json({
                    status : "ok",
                    message: "User Not Found"
                });   
          }
          });
                // referral commission
                return res.json({
                    status: 200,
                    error: false,
                    message: "Order Executed Successfully"
                  });
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Insufficient "+req.body.currencyType+" Balance",
              });
        }    
        
    } catch (error) {
        console.log("Error from: createOrder ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }


  async function OrderHistory(amount,  raw_price,quantity,  currencyType,  compairCurrency,  email) {
    const Order = require("../models/order")
    const order = await new Order({
        email: email,
        date: Date.now(),
        amount: amount,
        raw_price: raw_price,
        cVolume: quantity,
        currency_type: currencyType,
        compair_currency: compairCurrency
      });

      order.save((error, data) => {
        if (error) {
          console.log("Error from: OrderHistory", error.message);
          return ({
            status: 0,
            message: "Somthing went wrong",
          });
        }
        if(data) {
            return ({
                status: 0,
                message: "Order Created",
              });
        }
      });
  }

  exports.getAllOrder = async(req, res) => {
    const Order = require("../models/order")
    try{
      const query  = req.query
      const page = query.page
      const per_page = query.per_page
      delete query.page
      delete query.per_page
      // console.log("quary", query)
      const order = await Order.find({query})
      return res.json({
        status: 200,
        error: false,
        order: order,
      });

    } catch(error){
      console.log("Error from: getAllOrder ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }

  exports.depositHestory = async(req, res) => {
    const Transaction = require("../models/transaction_history")
    try{
      const query  = req.query
      const page = query.page
      const per_page = query.per_page
      delete query.page
      delete query.per_page
      const transaction = await Transaction.find({query})
      return res.json({
        status: 200,
        error: false,
        transaction: transaction,
      });

    }catch(error) {
      console.log("Error from: depositHestory ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }


  exports.levelIncomeHistory = async(req, res) => {
    const Transaction = require("../models/transaction_history")
    try{
      const  query  = req.query
      const page = query.page
      const per_page = query.per_page
      delete query.page
      delete query.per_page
      const transaction = await Transaction.find(query)
      return res.json({
        status: 200,
        error: false,
        order: transaction,
      });

    }catch(error) {
      console.log("Error from: depositHestory ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }

  exports.getUser = async(req, res) => {
    const User = require("../models/user")
    try{
      const  query  = req.query
      const page = query.page
      const per_page = query.per_page
      delete query.page
      delete query.per_page
      const user = await User.find(query)
      return res.json({
        status: 200,
        error: false,
        user: user,
      });

    }catch(error) {
      console.log("Error from: allUser ", error)
      return res.json({
        status: 400,
        error: true,
        message: "Somthing Went Wrong!!**********",
        err: error.message,
      });
    }
  }


  // exports.cryptoSetting = async(req, res) => {

  // }


  exports.addColdWallet = async(req, res) => {
    const coldWallet = require("../models/cold_Wallet");
    try {
      const { 
        symbol,
        wallet_address,
      } = req.body;
      const wallet = await coldWallet.findOne({ wallet_address: wallet_address });
      if (wallet) {
       await coldWallet.updateOne({_id: wallet._id}, {
         $set: {
          symbol: symbol,
          wallet_address: wallet_address,
         }
       })
        return res.status(200).json({ message: "Success" });
      }
      const createWall = new coldWallet({
        symbol,
        wallet_address
      });
      createWall.save((error, wall) => {
        if (error) {
          console.log("Error from: addColdWallet", error.message);
          return res.status(400).json({ message: "something went wrong" });
        }
        if (wall) {
          return res.status(200).json({ message: "Success" });
        }
      });
    } catch (error) {
      console.log("Error From: BuySell.js >>addColdWallet ", error.message);
      return res.status(400).json({ message: "Somthing went wrong" });
    }
  }
  
  exports.getColdWallet = async(req, res) => {
    const coldWallet = require("../models/cold_Wallet");
    try{
      coldWallet.find(req.query).then((wall) => {
        return res.status(200).json({msg: "Wallets", wall: wall})
      })
  
    }catch(error) {
      console.log("Error from: getColdWallet ", error.message)
      return res.status(400).json({msg: "Somthing went wrong"})
    }
  }
  