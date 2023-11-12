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
  appliedOfferID:{
    type:String,
    default:null,
  }
});

module.exports = mongoose.model('Category',categorySchema)