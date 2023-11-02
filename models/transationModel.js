const mongoose = require("mongoose");

const trancnSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  order_id: {
    type: String,
    required: true,
  },
  paid_amount: {
    type: Number,
    required: true,
  },
  payment_method: {
    type: String,
    required: true,
  },
  trans_id: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", trancnSchema);
