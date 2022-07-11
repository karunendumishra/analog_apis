const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('../../models/user');
const percent = require('../../models/referral_percent');

app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

exports.alluser = async (req, res) => { 
        const {per_page,page,srch,field} = req.query
        if(field!="" && srch!=""){
        if(field=="email"){
        const user = await User.find({"email": new RegExp('.*' + srch + '.*')}).limit(per_page).skip(per_page*(page-1));
        res.status(200).json({user_data:user,totalCount:user.length});
        }
        if(field=="my_referral_code"){
            const user = await User.find({"my_referral_code": new RegExp('.*' + srch + '.*')}).limit(per_page).skip(per_page*(page-1));
            res.status(200).json({user_data:user,totalCount:user.length});
        }
        if(field=="createdAt"){
            new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
            var d = new Date(srch);
            d.setHours(0,0,0,0);
            //const dt = new Date("2022-04-26");
            const dt = new Date(+d + 86400000);
            const user = await User.find({
            createdAt: {
                  $gte: d,
                  $lt: dt
              }
        }).limit(per_page).skip(per_page*(page-1));
            res.status(200).json({user_data:user,totalCount:user.length});
            }
      } else {
          const user = await User.find({}).limit(per_page).skip(per_page*(page-1));
          res.status(200).json({user_data:user,totalCount:user.length});
      }
        // console.log(user,"user")
        
          
  }
  
  exports.bonuspercent = async (req, res) => { 
        const user = await percent.find({})
        res.status(200).json({Bonus_percent:user});
  }

  exports.allusertoday = async (req, res) => {
      const {per_page,page} = req.query
      new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
      var d = new Date();
      d.setHours(0,0,0,0);
      //const dt = new Date("2022-04-26");
      const dt = new Date(+d + 86400000);
      console.log(d);
      console.log(dt);
      const user = await User.find({
                isVarify:1,
          createdAt: {
                $gte: d,
                $lt: dt
            }
      }).limit(per_page).skip(per_page*(page-1));
      // console.log(user,"user")
      
        res.status(200).json({user_data:user,totalCount:user.length});
  }

  exports.alluserbydate = async (req, res) => {
      const {per_page,page,d,dt} = req.query
      new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
      console.log(d);
      console.log(dt);
      const user = await User.find({
                isVarify:1,
          createdAt: {
                $gte: d,
                $lt: dt
            }
      }).limit(per_page).skip(per_page*(page-1));
      // console.log(user,"user")
      
        res.status(200).json({user_data:user,totalCount:user.length});
  }


  exports.createTeamMember  = async (req, res) => {
      try{
      const { name, degination } = req.body;    

      const image = await uploadImage(req.files.image, "image_" + Date.now());
      const teamMemberModel = require('../../models/company/teamMember');

          teamMemberModel.create({
            name: name,
            degination: degination,
            image: image,
            status: 1,       
          })
          .then((data) => {
            res.status(200).json({
              status : 1,
              message : "Record inserted"
            })
          })
          .catch((error) => {
             console.log("error: ", error.message);
          });
      
      }catch(error){
        console.log("Error in teammember api "+error);
      }
    }
    

    exports.createNews  = async (req, res) => {
      try{
      const { title, shortMessage, message, image } = req.body;
      const newsPrModel = require('../../models/company/newsPr');
    
      newsPrModel.create({
            title: title,
            shortMessage: shortMessage,
            message: message,
            image: image,       
          })
          .then((data) => {
            res.status(200).json({
              status : 1,
              message : "Record inserted"
            })
          })
          .catch((error) => {
             console.log("error: ", error.message);
          });
      
      }catch(error){
        console.log("Error in create news api "+error);
      }
    }
    

  exports.addOffers = async (req, res) => {     
      try {
        const offersModel = require('../../models/company/offers');
        const banner = await uploadImage(req.files.banner, "offers_" + Date.now());
        new offersModel({ ...req.body, banner }).save((error, offers) => {
          if (error){ 
            console.log("Error :", error);
          }else{
          res.status(200).json({ message: "offers added successfully.", offers });
        }
      })
      } catch (error) {
        console.log("error from: add offers", error.message);
        res.status(400).json({ message: "Somthing went wrong" });
      }
    }

    async function uploadImage(data_stream, file_name) {
      const mime = require("mime");
      const fs = require("fs");
      try {
        var decodedImg = data_stream;
        var imageBuffer = decodedImg.data;
        var type = decodedImg.mimetype;
        var extension = mime.getExtension(type);
        const newname = file_name.split("/").join("");
        var fileName = newname + "-image." + extension;
    
        try {
          fs.writeFileSync("./uploads/images/" + fileName, imageBuffer, "utf8");
        } catch (err) {
          console.log("Error: in file upload: ", err.message);
          return undefined;
        }
        const file_path = `/images/${fileName}`;
        return file_path;
      } catch (error) {
        console.log("Error in file upload: bankDetail >> uploadImage", error);
        return undefined;
      }
    }
  