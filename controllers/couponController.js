const Coupon = require("../models/couponModel");
const User = require("../models/userModel")
const Cart = require("../models/userCartModel");

//calculate function
const calculateTotalPrice = async (userId) => {
    try {
      const cart = await Cart.findOne({ user_id: userId }).populate(
        "products.product"
      );
      // console.log(cart);
      if (!cart) {
        console.log("User does not have a cart.");
      }
  
      let totalPrice = 0;
      for (const cartProduct of cart.products) {
        const { product, quantity } = cartProduct;
        const productSubtotal = product.price * quantity;
        totalPrice += productSubtotal;
      }
  
      // console.log('Total Price:', totalPrice);
      return totalPrice;
    } catch (error) {
      console.error("Error calculating total price:", error.message);
      return 0;
    }
  };
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

//coupon application here
const ApplyCoupon = async (req, res) => {
    try {
        // console.log(req.body.code);
      let couponCode = req.body.code;
      let userId = req.session.user_id;
      let cartTotalAmount = await calculateTotalPrice(userId);
  
      const coupon = await Coupon.findOne({coupon_code: couponCode });
      // console.log(coupon);
      if (coupon == null) {
        // console.log("condition called ..");
        return res.json({ valid: false, message: "Coupon not Valid" });
      }
  
      if (coupon.usersUsed.includes(userId)) {
        return res.json({
          valid: false,
          message: "You have already claimed this coupon",
        });
      }
  
      const currentDate = new Date();
      if (currentDate < coupon.start_date || currentDate > coupon.end_date) {
        return res.json({ valid: false, message: "Coupon is not valid" });
      }
  
      if (cartTotalAmount < coupon.min_purchase_amount) {
        return res.json({
          valid: false,
          message: "The minimum spend has not been met",
        });
      }
  
      // Check if the maximum number of users have already redeemed the coupon
      if (coupon.usersUsed.length >= coupon.maxUsers) {
        return res.json({
          valid: false,
          message: "Coupon has reached the maximum usage limit",
        });
      }
  
      let redeem = {
        code: coupon.coupon_code,
        discount: coupon.discount_price,
        total: cartTotalAmount - coupon.discount_price,
        _id: coupon._id,
      };
      return res.json({ valid: true, redeem });
    } catch (error) {
      console.log(error.message);
  }
  };



module.exports = {
    create_coupon,
    load_coupenCreate,
    load_couponDash,
    loadCouponEdit,
    updateCoupon,
    userCouponDisplay,
    ApplyCoupon
}