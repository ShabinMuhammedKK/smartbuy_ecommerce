const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category:{
    type:String,
    required:true,
  },
  description:{
    type:String,
    required:true,
  },
  is_unlisted:{
    type:Number,
    default:0
  },
  forIdentity:{
    type:String,
    required:true
  },
  appliedOfferID:{
    type:String,
    default:"",
  }
});

module.exports = mongoose.model('Category',categorySchema)