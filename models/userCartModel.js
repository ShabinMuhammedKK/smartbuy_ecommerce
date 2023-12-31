const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    products:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Product',
                required:true,
            },
            quantity:{
                type:Number,
                default:1,
                min:1,
                max:5,
            }
        }
    ],
    createdAt:{
        type:Date,
        default:Date.now,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        required:true,
    },
})

module.exports = mongoose.model('Cart',cartSchema)