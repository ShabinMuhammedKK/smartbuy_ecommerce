const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    address:[
        {
            country:{
                type:String,
                required:true,
            },
            fullName:{
                type:String,
                required:true,
            },
            mobileNo:{
                type:Number,
                required:true,
            },
            pincode:{
                type:Number,
                required:true,
            },
            city:{
                type:String,
                required:true,
            },
            state:{
                type:String,
                required:true,
            }        
        }
    ]
})

module.exports = mongoose.model('UserAddress',addressSchema);