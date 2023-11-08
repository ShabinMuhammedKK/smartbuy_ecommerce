const Coupon = require("../models/couponModel");
const User = require("../models/userModel")


//coupen create page load
const load_coupenCreate = async (req,res)=>{
    try {
        res.render("couponCreate");
    } catch (error) {
        console.log(error.message);
    }
}

//coupon creation
const create_coupon = async(req,res)=>{
    try {
        const coupon_data = req.body;
        const {code,descr,disAmo,minPur,strD,endD,userLim,usageLim} = coupon_data;

        const couponData  = new Coupon({
            coupon_code:code,
            description:descr,
            discount_price:disAmo,
            min_purchase_amount:minPur,
            start_date:strD,
            end_date:endD,
            usage_limit_perUser:userLim,
            total_usageLimit:usageLim,
        })

        const createdCoupon = await couponData.save();
        console.log(createdCoupon);

    } catch (error) {
        console.log(error.message);
    }
}

//coupen listing in admin dashbord
const load_couponDash = async(req,res)=>{
    try {
        const userData = await User.findById({ _id: req.session.user_id });
    
        const listingCoupons = await Coupon.find();
        res.render('couponDash',{listingCoupons,admin: userData});
    } catch (error) {
        console.log(error.message);
    }
}


//coupenEdit
const loadCouponEdit = async (req,res)=>{
    try {
        const copID = req.query.id;
        const listingCoupons = await Coupon.find({_id:copID});
        res.render('couponEdit',{datas:listingCoupons[0]});
        
    } catch (error) {
        console.log(error.message);
    }
}

//updated the edited coupon data
const updateCoupon = async (req,res)=>{
    try {
        productID = req.body._id;
        const updateObject = {
            coupon_code:req.body.code,
            description:req.body.descr,
            discount_price:req.body.disAmo,
            min_purchase_amount:req.body.minPur,
            start_date:req.body.strD,
            end_date:req.body.endD,
            usage_limit_perUser:req.body.userLim,
            total_usageLimit:req.body.usageLim,
          };

          const couponUpdatedData = await Coupon.findByIdAndUpdate(
            { _id: req.body._id },
            { $set: updateObject },
            { new: true }
          );
          if(couponUpdatedData){
            return res.redirect("/admin/dashboard");
          }
    } catch (error) {
        console.log(error.message);
    }
}

//coupon listing in user side
const userCouponDisplay = async(req,res)=>{
    try {
        const displayCoupons =await Coupon.find();
        // console.log(dis)
        return res.render('coupons',{coupons:displayCoupons});
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    create_coupon,
    load_coupenCreate,
    load_couponDash,
    loadCouponEdit,
    updateCoupon,
    userCouponDisplay
}