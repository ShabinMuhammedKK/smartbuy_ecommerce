const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  mobile:{
    type:String,
    required:true
  },
  toReffer:{
    type:Number,
    required:true,
  },
  refOffer:{
    type:Number,
    default:0,
  },
  image:{
    type:String,
    default:0,
  },
  wallet:{
    type:Number,
    default:0
  },
  password:{
    type:String,
    required:true
  },
  address:{
    type:String,
    default:0,
  },
  pincode:{
    type:Number,
    default:0,
  },
  is_admin:{
    type:Number,
    default:0,
  },
  is_verified:{
    type:Number,
    default:0
  },
  is_blocked:{
    type:Number,
    default:0
  }
});

module.exports = mongoose.model('User',userSchema)
