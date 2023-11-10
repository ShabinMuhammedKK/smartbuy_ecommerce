const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  basePrice:{
    type:Number,
    required:true
  },
  price:{
    type:Number,
    required:true
  },
  image1:{
    type:String,
    required:true
  },
  image2:{
    type:String,
    required:true
  },
  image3:{
    type:String,
    required:true
  },
  image4:{
    type:String,
    required:true
  },
  image5:{
    type:String,
    required:true
  },
  sellername:{
    type:String,
    required:true
  },
  category:{
    type:String,
    required:true,
  },
  stock:{
    type:Number,
    default:0,

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

module.exports = mongoose.model('Product',productSchema)
