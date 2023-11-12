const express = require("express");
const user_route = express();
const userController = require("../controllers/userController");
const multer = require('multer');
const orderController = require("../controllers/orderController");
const couponController = require('../controllers/couponController')
const path = require('path');
const session = require('express-session');
const auth = require('../middleware/auth');


user_route.use(session({
  secret:process.env.sessionSecret,
  resave: false,
  saveUninitialized: true,
}))



user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

user_route.set('view engine','ejs');
user_route.set('views','./views/users');

const storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,path.join(__dirname, '../public/userImages'));
  },
  filename:function(req,file,cb){
    const name = Date.now() + '-' + file.originalname;
    cb(null,name)
  }
})
const upload = multer({storage:storage})




user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);

user_route.post('/verifyOTP',userController.verifyOTP);
user_route.get('/verifyOTP',userController.verifyOTP);

user_route.get('/product',userController.lodadProductDetails);

user_route.get('/resendOTP',userController.resendOTP);

user_route.get('/',auth.isLogout,userController.loadHome);
user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.post('/login',auth.isLogout,userController.verifyLogin);

user_route.get('/Allproducts',userController.loadProductListingPage);
user_route.post('/Allproducts',userController.loadProductListingPage);
user_route.get('/home',auth.isLogin,userController.loadHome)
user_route.get('/logout',auth.isLogin,userController.userLogout)
user_route.get('/userProfile',auth.isLogin,userController.loadUserProfile)
user_route.get('/userCart',auth.isLogin,userController.loadCartPage);

user_route.get('/loadUserEdit',auth.isLogin,userController.loadUserEdit);
user_route.post('/loadUserEdit',upload.single('image'),userController.updateEdit);

user_route.post('/addToCart',auth.isLogin,userController.addToCart)
user_route.post('/addToWishlist',auth.isLogin,userController.addToWishlist)

user_route.get('/checkout',auth.isLogin,userController.loadcheckoutPage);
user_route.get("/addressPage",auth.isLogin,userController.loadAddressUploadPage);
user_route.post("/addressPage",auth.isLogin,userController.addAddress);
user_route.post("/orderPlaceClicked",auth.isLogin,orderController.placeOrderManage);

user_route.post("/changeqty",auth.isLogin,userController.productQuantityHandling)

user_route.post('/removeProductFromCart/:productId',auth.isLogin,userController.removeProductFromCart);

user_route.get('/userOrders',auth.isLogin,orderController.orderUserProfile)

user_route.post('/cancelOrder',auth.isLogin,orderController.cancelOrderByUser);

user_route.post('/deleteAddr',auth.isLogin,userController.removeAddr);

user_route.post('/verifyPayment',orderController.verifyPayment);

user_route.get('/coupons',auth.isLogin,couponController.userCouponDisplay);
user_route.post('/coupeonApply',auth.isLogin,couponController.ApplyCoupon);

user_route.get('/wishlist',auth.isLogin,userController.leadWishList);


module.exports = user_route;