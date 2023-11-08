const mongoose = require("mongoose");


const couponSchema = mongoose.Schema({
    coupon_code:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    discount_price:{
        type:Number,
        required:true,
    },
    min_purchase_amount:{
        type:Number,
        require:true,
    },
    start_date:{
        type: Date,
        required:true,
    },
    end_date:{
        type:Date,
        required:true,
    },
    usage_limit_perUser:{
        type:Number,
        required:true,
    },
    total_usageLimit:{
        type:Number,
        required:true,
    },
    created_at:{
        type:Date,
        default:Date.now,
    },


})

const Coupon = mongoose.model('Coupon',couponSchema);
module.exports = Coupon;