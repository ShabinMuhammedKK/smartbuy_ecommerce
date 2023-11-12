const mongoose = require('mongoose');
const wishlistSchema = new mongoose.Schema({
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
                max:1,
            }
        }
    ],
})

module.exports = mongoose.model('Wishlist',wishlistSchema)