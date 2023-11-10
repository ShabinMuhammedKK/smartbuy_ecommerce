const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  offerPercentage: {
    type: Number,
    required: true,
  },

  startDate: {
    type: Date,
    required:true,
  },
  endDate: {
    type: Date,
    required:true,
  },
  offerID:{
    type:String,
    required:true,
  },
//   productUsed: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product", 
//     },
//   ],

});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;