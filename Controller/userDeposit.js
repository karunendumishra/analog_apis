const userWallet = require('../models/userWallet');
exports.userDeposit = async (req, res) => {
    const Web3 = require("web3");
  
    const dex = [
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          { indexed: true, internalType: "address", name: "to", type: "address" },
          {
            indexed: false,
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { name: "_to", type: "address" },
          { name: "_value", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "success", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ];
  
    /** trx
     *
     */
    const TronWeb = require("tronweb");
    const tronWeb = new TronWeb({ fullHost: "https://api.shasta.trongrid.io" });
    /**
     * bnb
     */
    const BSCTESTNET_WSS = "https://data-seed-prebsc-1-s1.binance.org:8545/";
    //const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
    //const web3ProviderBnb = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
    const web3ProviderBnb = new Web3.providers.HttpProvider(BSCTESTNET_WSS);
    const web3Bnb = new Web3(web3ProviderBnb);
  
    /**
     * eth
     */
    // const eth_mainnet = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
    const eth_testnet =
      "https://kovan.infura.io/v3/235ebabc8cf1441c8ead19deb49bba49";
    const web3Provider = new Web3.providers.HttpProvider(eth_testnet);
    const web3Eth = new Web3(web3Provider);
  
    /**
     * polygon / Matic
     */
    const MATICTESTNET_WSS = "https://rpc-mumbai.maticvigil.com";
    //const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
    //const web3ProviderMatic = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
    const web3ProviderMatic = new Web3.providers.HttpProvider(MATICTESTNET_WSS);
    const web3Matic = new Web3(web3ProviderMatic);
  
    const email = req.body.email;
    if (email) {
      let go = await canUpdate(email);
      if (go) {
        var walletETH     = await userWallet.findOne({ email: email, symbol: "ETH" });
        var walletTRX     = await userWallet.findOne({ email: email, symbol: "TRX" });
        var walletBNB     = await userWallet.findOne({ email: email, symbol: "BNB" });
        var walletMATIC   = await userWallet.findOne({ email: email, symbol: "MATIC"});
        var walletUSDT    = await userWallet.findOne({ email: email, symbol: "USDT" });
        var walletBUSD    = await userWallet.findOne({ email: email, symbol: "BUSD" });
        var walletSHIB    = await userWallet.findOne({ email: email, symbol: "SHIB" });
  

        if (walletTRX && walletTRX.symbol == "TRX") {
          console.log("TRX");
          try {
            let wallet = walletTRX;
            const decimal = 1e6;
            let trx_balance = await tronWeb.trx.getBalance(walletTRX.walletAddr);
            console.log(trx_balance / decimal + " TRX balance");
            const balance = trx_balance / decimal;
            if (balance > 0) {
              /**
               * check for w balance
               */
              const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;    
              const v_balance  = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0; 
              //check for admin transfer
              const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;            
              const balance_without_admin_transfer = balance - admin_transfer;
              const updated_balance = balance_without_admin_transfer - v_balance;
              /**
               * update user's wallet
               */ 
              //console.log(updated_balance + " Updated balance");
               if (updated_balance >= 0) {
                const new_v_balance = v_balance + updated_balance;
                const new_w_balance = w_balance + updated_balance;

                await userWallet.updateOne(
                  { email: email, symbol: "TRX" },
                  {
                    $set: {
                      balance: new_w_balance,
                      v_balanace: new_v_balance,
                    },
                  }
                );
                if (updated_balance > 0) {                
                   createDepositHistory(email, "TRX", wallet.walletAddr, updated_balance, updated_balance );          
  
                     var subject = "New TRX Transaction";
                     var msg = `<h5>Hello ${wallet.username}, <br> ${updated_balance} TRX deposited in your account`;            
                     sendMail(email, subject, msg);                 
                }         
            }
          }
          } catch (err) {
            console.log("Error in getting TRX balance " + err);
          }
        }
  
        if (walletETH && walletETH.symbol == "ETH") {
          console.log("ETH");
          try {
            let wallet = walletETH;
            const decimal = 1e18;
            let eth_balance = await web3Eth.eth.getBalance(walletETH.walletAddr);
            console.log(eth_balance / decimal + " ETH balance");
            const balance = eth_balance / decimal;
            if (balance > 0) {
              /**
               * check for w balance
               */
              const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
              const new_w_balance = balance;
              /**
               * update user's wallet
               */
              if (new_w_balance != w_balance) {
                await userWallet.updateOne(
                  { email: email, symbol: "ETH" },
                  {
                    $set: {
                      balance: new_w_balance,
                      old_balanace: w_balance,
                    },
                  }
                );
                if (balance > 0) {
                  const new_transaction = new_w_balance - w_balance;
                  createDepositHistory(email, "ETH", wallet.walletAddr, new_transaction, new_w_balance);
  
                  var subject = "New ETH Transaction";
                  var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} ETH deposited in your account`;            
                  sendMail(email, subject, msg);  
                }
              }
            }
          } catch (err) {
            console.log("Error in getting ETH balance " + err);
          }
        }
  
        if (walletBNB && walletBNB.symbol == "BNB") {
          console.log("BNB");
          try {
            let wallet = walletBNB;
            const decimal = 1e18;
            const bnb_balance = await web3Bnb.eth.getBalance(walletBNB.walletAddr);
            console.log(bnb_balance / decimal + " BNB balance");
            const balance = bnb_balance / decimal;
            if (balance > 0) {
              /**
               * check for w balance
               */
              const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
              const new_w_balance = balance;
              /**
               * update user's wallet
               */
              if (new_w_balance != w_balance) {
                await userWallet.updateOne(
                  { email: email, symbol: "BNB" },
                  {
                    $set: {
                      balance: new_w_balance,
                      old_balanace: w_balance,
                    },
                  }
                );
                if (balance > 0) {
                  const new_transaction = new_w_balance - w_balance;
                  createDepositHistory(email, "BNB", wallet.walletAddr, new_transaction, new_w_balance);
  
                  var subject = "New BNB Transaction";
                  var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BNB deposited in your account`;            
                  sendMail(email, subject, msg); 
                }
              }
            }
          } catch (err) {
            console.log("Error in getting BNB balance " + err);
          }
        }
  
        if (walletMATIC && walletMATIC.symbol == "MATIC") {
          console.log("MATIC");
          try {
            let wallet = walletMATIC;
            const decimal = 1e18;          
            const matic_balance = await web3Matic.eth.getBalance(wallet.walletAddr);
            console.log(matic_balance / decimal + " Matic balance");
            const balance = matic_balance / decimal;
  
            if (balance > 0) {
              /**
               * check for w balance
               */
              const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
              const new_w_balance = balance;
              /**
               * update user's wallet
               */
              if (new_w_balance != w_balance) {
                await userWallet.updateOne(
                  { email: email, symbol: "MATIC" },
                  {
                    $set: {
                      balance: new_w_balance,
                      old_balanace: w_balance,
                    },
                  }
                );
                if (balance > 0) {
                  const new_transaction = new_w_balance - w_balance;
                  createDepositHistory( email, "MATIC", wallet.walletAddr, new_transaction, new_w_balance);
  
                  var subject = "New MATIC Transaction";
                  var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} MATIC deposited in your account`;            
                  sendMail(email, subject, msg); 
                }
              }
            }
          } catch (err) {
            console.log("Error in getting Matic Balance " + err);
          }
        }
  
        if (walletUSDT && walletUSDT.symbol == "USDT") {
          console.log("USDT");
          try {
            let wallet = walletUSDT;
            const decimal = 1e6;
            tronWeb.setAddress(wallet.walletAddr);
            const instance = await tronWeb.contract().at("TLtzV8o37BV7TecEdFbkFsXqro8WL8a4tK");
            const hex_balance = await instance.balanceOf(wallet.walletAddr).call();
            const usdt_balance = Number(hex_balance._hex);
  
            if (usdt_balance > 0) {
              /**
               * check for w balance
               */
  
              let balance = usdt_balance ? usdt_balance / decimal : 0;
              const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
              const new_w_balance = balance;
              /**
               * update user's wallet
               */
              console.log(new_w_balance + " USDT balance");
              if (new_w_balance != w_balance) {
                await userWallet.updateOne(
                  { email: email, symbol: "USDT" },
                  {
                    $set: {
                      balance: new_w_balance,
                      old_balanace: w_balance,
                    },
                  }
                );
                if (balance > 0) {
                  const new_transaction = new_w_balance - w_balance;
                  createDepositHistory( email, "USDT", wallet.walletAddr, new_transaction, new_w_balance );
  
                  var subject = "New USDT Transaction";
                  var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} USDT deposited in your account`;            
                  sendMail(email, subject, msg); 
                }
              }
            }
          } catch (err) {
            console.log("Error in getting USDT balance " + err);
          }
        }
  
        if (walletBUSD && walletBUSD.symbol == "BUSD") {
          console.log("BUSD");
          try {
            let wallet = walletBUSD;
            var contract = new web3Bnb.eth.Contract(dex,"0x1004f1CD9e4530736AadC051a62b0992c198758d");
            const decimal = 18; //await contract.methods.decimals().call();
            const bal = await contract.methods.balanceOf(wallet.walletAddr).call();
            console.log("Bal: ", bal);
            let busd_balance = bal ? bal / Number(`1e${decimal}`) : 0;
  
            if (busd_balance > 0) {
              /**
               * check for w balance
               */
              let balance = busd_balance ? busd_balance / decimal : 0;
              const w_balance = wallet[0].balance
                ? parseFloat(wallet[0].balance)
                : 0;
              const new_w_balance = balance;
              /**
               * update user's wallet
               */
              console.log(new_w_balance + " BUSD balance");
              if (new_w_balance != w_balance) {
                await userWallet.updateOne(
                  { email: email, symbol: "BUSD" },
                  {
                    $set: {
                      balance: new_w_balance,
                      old_balanace: w_balance,
                    },
                  }
                );
                if (balance > 0) {
                  const new_transaction = new_w_balance - w_balance;
                  createDepositHistory( email, "BUSD", wallet.walletAddr, new_transaction, new_w_balance);
  
                  var subject = "New BUSD Transaction";
                  var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} BUSD deposited in your account`;            
                  sendMail(email, subject, msg); 
                }
              }
            }
          } catch (err) {
            console.log("Error in getting BUSD balance " + err);
          }
        }
  
        if (walletSHIB && walletSHIB.symbol == "SHIB") {
          console.log("SHIB");
          try {
            let wallet = walletSHIB;
            var contract = new web3Bnb.eth.Contract(dex,"0x1004f1CD9e4530736AadC051a62b0992c198758d"
            );
            const decimal = 18; //await contract.methods.decimals().call();
            const bal = await contract.methods.balanceOf(wallet.walletAddr).call();
            console.log("Bal: ", bal);
            let shib_balance = bal ? bal / Number(`1e${decimal}`) : 0;
  
            if (shib_balance > 0) {
              /**
               * check for w balance
               */
              let balance = shib_balance ? shib_balance / decimal : 0;
              const w_balance = wallet[0].balance ? parseFloat(wallet.balance) : 0;
              const new_w_balance = balance;
              /**
               * update user's wallet
               */
              console.log(new_w_balance + " SHIB balance");
              if (new_w_balance != w_balance) {
                await userWallet.updateOne(
                  { email: email, symbol: "SHIBA" },
                  {
                    $set: {
                      balance: new_w_balance,
                      old_balanace: w_balance,
                    },
                  }
                );
                if (balance > 0) {
                  const new_transaction = new_w_balance - w_balance;
                  createDepositHistory( email, "SHIB", wallet.walletAddr, new_transaction, new_w_balance);
  
                  var subject = "New SHIB Transaction";
                  var msg = `<h5>Hello ${wallet.username}, <br> ${new_transaction} SHIB deposited in your account`;            
                  sendMail(email, subject, msg); 
                }
              }
            }
          } catch (err) {
            console.log("Error in getting SHIB balance " + err);
          }
        }
      }
    }
  };
  


  function createDepositHistory(email, symbol, address, amount, balance) {
    const transaction_history = require("../models/transaction_history");
    try {
      // if (user_id && type && address && amount) {
      transaction_history
        .create({
          email: email,
          symbol: symbol,
          status: 1,
          amount: amount,
          balance: balance,
          to_address: address,
          type: "deposit",
        })
        .then((data) => {
          // console.log("history created", user_id);
        })
        .catch((error) => {
          // console.log("error: ", error.message);
        });
  
      // } else {
      //     return false;
      // }
      return true;
    } catch (error) {
      return false;
  }
  }
  
  async function canUpdate(email) {
  const transaction_history = require('../models/transaction_history');
  try {
      let last_deposit = await transaction_history.findOne({ email: email }).sort({ createdAt: -1 });
      if (last_deposit) {
          let last_created = last_deposit.createdAt ? last_deposit.createdAt : undefined;
          if (last_created) {
              let d = new Date(last_created).getTime();
              if (d) {
                  if (new Date().getTime() - d > 3000) {
                      return true;
                  } else {
                      return false;
                  }
              } else {
                  return true;
              }
          } else {
              return true;
          }
      } else {
          return true;
      }
  } catch (error) {
      console.log("error in canupdate: ", error.message)
      return false;
  }
  }
  