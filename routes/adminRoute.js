const express = require('express');
const admin_route = express();
const session = require('express-session');
const multer = require('multer');
const path = require('path');
require("dotenv").config();


admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));

admin_route.use(session({
    secret:process.env.sessionSecret,
    resave: false,
    saveUninitialized: true,
  }));

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const auth = require('../middleware/adminAuth');

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

const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');



admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyLogin);
admin_route.get('/home',auth.isLogin,adminController.adminDashboard);
admin_route.get('/logout',adminController.logout);
admin_route.get('/dashboard',auth.isLogin,adminController.adminDashboard)
admin_route.post('/blockuser',adminController.userBlock);
admin_route.post('/unlistproduct',adminController.productUnlist);
admin_route.post('/unlistcategory',adminController.categoryUnlist);
admin_route.get('/addProduct',adminController.loadProductAdd)
admin_route.post('/addProduct',upload.array('image',5),adminController.insertProduct)
admin_route.get('/addCategory',adminController.loadCategoryAdd)
admin_route.post('/addCategory',adminController.insertCategory);
admin_route.get('/loadUserEdit',adminController.loadUserEdit);
admin_route.post('/loadUserEdit',upload.single('image'),adminController.loadUserEdit);
admin_route.get('/loadProductEdit',adminController.loadProductEdit);
admin_route.post('/loadProductEdit',upload.array('image',5),adminController.updateProductEdit);
admin_route.get('/search',adminController.searchEasy);
admin_route.get('/usersData',auth.isLogin,adminController.UserDash);
admin_route.get('/productData',auth.isLogin,adminController.productDash); 
admin_route.get('/categoryData',auth.isLogin,adminController.categoryDash);
admin_route.get("/ordersList",auth.isLogin,adminController.ordersListing);
admin_route.get("/manageOrders",auth.isLogin,adminController.orderManage);

admin_route.post('/cancelOrders',auth.isLogin,orderController.cancelOrderByAdmin);
admin_route.post('/statusChange',auth.isLogin,orderController.statusChange);




admin_route.get('*',function(req,res){
    res.redirect('/admin');
})

module.exports = admin_route;