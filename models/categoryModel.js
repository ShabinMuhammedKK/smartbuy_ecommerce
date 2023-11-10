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
  offers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
    },
  ],
});

module.exports = mongoose.model('Category',categorySchema)