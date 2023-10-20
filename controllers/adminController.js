const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel")
const bcrypt = require('bcrypt');


//=======================================user controller==================


const loadLogin = async(req,res)=>{

    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }

}

const verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email});
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                if(userData.is_admin === 0){
                    res.render('login',{message:"Email or password is incorrect"});

                }else{
                    req.session.user_id = userData._id;
                    res.redirect("/admin/home");
                }
            }else{
                res.render('login',{message:"Email or password is incorrect"});

            }
        }else{
            res.render('login',{message:"Email or password is incorrect"});
        }
        
        
    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async(req,res)=>{
    try {
         const userData = await User.findById({_id:req.session.user_id});
        res.render('home',{admin:userData});
    } catch (error) {
        console.log(error.message);
    }

    
}

const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
    }
}

const adminDashboard = async(req,res)=>{
    try {
        const usersData = await User.find({is_admin:0});
        const adminData = await User.findOne({is_admin:1});
        const productData = await Product.find();
        const categoryData = await Category.find();
        res.render('dashboard',{users:usersData,products:productData,admin:adminData,category:categoryData});
    } catch (error) {
        console.log(error.message);
    }
}

//------------------------------user edit

const loadUserEdit = async(req,res)=>{
  try {
    
    const id = req.query.id;
    if(id){
      const userData = await User.findById({_id:id});
    if(userData){
     
      res.render('editUserData' ,{user:userData});
    }else{
      res.redirect('dashboard');
    }
    }else(
      console.log(error.message)
    )
  } catch (error) {
    console.log(error.message);
  }
}

const updateEdit = async(req,res)=>{


  try {
    if(req.file){
       const userUpdatedData = await User.findByIdAndUpdate({_id:req.body.user_id},
        {$set:{name:req.body.name,
          email:req.body.email,
          mobile:req.body.mno,
          image:req.file.filename}})
      }else{
       const userUpdatedData = await User.findByIdAndUpdate({_id:req.body.user_id},
        {$set:{name:req.body.name,
          email:req.body.email,
          mobile:req.body.mno}})
      }
  } catch (error) {
    console.log(error.message);
  }
}
//------------------------product edit

const loadProductEdit = async(req,res)=>{
  try {
    
    const id = req.query.id;
    if(id){
      const productData = await Product.findById({_id:id});
    if(productData){

      res.render('editProductData' ,{product:productData});
    }else{
      res.redirect('dashboard');
    }
    }else(
      console.log(error.message)
    )
  } catch (error) {
    console.log(error.message);
  }
}

const updateProductEdit = async(req,res)=>{


  try {
    if(req.file){
       const productUpdatedData = await Product.findByIdAndUpdate({_id:req.body.product_id},
        {$set:{name:req.body.name,
          description:req.body.description,
          sellername:req.body.sellername,
          stock:req.body.stock,
          image:req.file.filename,
          category:req.body.category,
          price:req.body.price,
        }})
      }else{
       const productUpdatedData = await Product.findByIdAndUpdate({_id:req.body.product_id},
        {$set:{name:req.body.name,
          description:req.body.description,
          sellername:req.body.sellername,
          stock:req.body.stock,
          category:req.body.category,
          price:req.body.price,
        }})
      }
  } catch (error) {
    console.log(error.message);
  }
}

//===search bar===========================================


const searchEasy = async(req,res)=>{
  try {
    const adminData = await User.findOne({is_admin:1});
    let searchDatas = await searchBarData(req.body.searches);
    res.render('dashboard',{users:searchDatas,admin:adminData});
  } catch (error) {
    console.log(error.message);
  }
}

const searchBarData = async(searches)=>{
  try {
    let searchDetaills = await User.find({
      "$or":[
        {name:{$regex:searches}},
        {mobile:{$regex:searches}},
        {email:{$regex:searches}}
      ]
    })
    return searchDetaills;
  } catch (error) {
    console.log(error.message);
  }
}


//==============================PRODUCT CONTROLLER===========================

const loadProductAdd = async (req, res) => {
  try {
    const categoryDatas = await Category.find();
    res.render("addProduct",{category:categoryDatas});
  } catch (error) {
    console.log(error.message);
  }
};

const insertProduct = async (req, res) => {
  try {
    
    const images = req.files;
    const imageFilenames = [];

    for (const image of images) {
      imageFilenames.push(image.filename);
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      image: imageFilenames,
      stock:req.body.stock,
      sellername: req.body.sellername,
      category: req.body.category,
    });
    const productData = await product.save();
    if (productData) {
      res.redirect("/admin/dashboard#productsData");
    } else {
      res.render("addProduct", {
        message: "Product cano't add",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};



//=====================================category=========================
const loadCategoryAdd = async (req, res) => {
  try {
    res.render("addCategory");
  } catch (error) {
    console.log(error.message);
  }
};

const insertCategory = async (req, res) => {
  try {
    

    const category = new Category({
      
      category: req.body.category,
      description: req.body.description,
      
    });
    const categoryData = await category.save();
    if (categoryData) {
      res.render("addCategory", {
        message:
          "Your category is added",
      });
    } else {
      res.render("addCategory", {
        message: "Category cano't add",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//====user block======================

const userBlock = async(req,res)=>{
  try {
      let blockStatus = await User.findOne({_id:req.body.id})
      if(blockStatus.is_blocked===0){
          let block = await User.updateOne({_id:req.body.id},{$set:{is_blocked:1}})
      }else{
          let unblock = await User.updateOne({_id:req.body.id},{$set:{is_blocked:0}})
      }
      
      let users = await User.find({});
      res.json({ users: users });

  } catch (error) {
      console.log(error.message);
}
}
//===product unlist==================

const productUnlist = async(req,res)=>{
  try {
      let unlistStatus = await Product.findOne({_id:req.body.id})
      if(unlistStatus.is_unlisted===0){
          const unlist = await Product.updateOne({_id:req.body.id},{$set:{is_unlisted:1}})
      }else{
          const list = await Product.updateOne({_id:req.body.id},{$set:{is_unlisted:0}})
      }
      
      const products = await Product.find({});
      res.json({ products: products });

  } catch (error) {
      console.log(error.message);
}
}

//======catogory unlist==================

const categoryUnlist = async(req,res)=>{
  try {
      let unlistStatus = await Category.findOne({_id:req.body.id})
      if(unlistStatus.is_unlisted===0){
          const unlist = await Category.updateOne({_id:req.body.id},{$set:{is_unlisted:1}})
      }else{
          const list = await Category.updateOne({_id:req.body.id},{$set:{is_unlisted:0}})
      }
      
      const category = await Category.find({});
      res.json({ category: category });

  } catch (error) {
      console.log(error.message);
}
}
//==========================================dashboard routing
const productDash = async(req,res)=>{
  try {
  const adminData = await User.findOne({is_admin:1});
  const productData = await Product.find();
  res.render('productDash',{products:productData,admin:adminData});
  } catch (error) {
    console.log(error.message);
  }
}

//==================================user dash
const UserDash = async(req,res)=>{
  try {


var search = '';
if(req.query.search){
  search = req.query.search;
}

  const usersData = await User.find({
    is_admin:0,
    "$or":[
      {name:{$regex:'.*'+search+'.*'}},
      {mobile:{$regex:'.*'+search+'.*'}},
      {email:{$regex:'.*'+search+'.*'}}
    ],
  });
  const adminData = await User.findOne({is_admin:1});
  res.render('userDash',{users:usersData,admin:adminData});
  } catch (error) {
    console.log(error.message);
  }
}
const categoryDash = async(req,res)=>{
  try {
  const adminData = await User.findOne({is_admin:1});
  const categoryData = await Category.find();
  res.render('categoryDash',{admin:adminData,category:categoryData});
  } catch (error) {
    console.log(error.message);
  }
}
//=========orders listing===

const ordersListing = async(req,res)=>{
  try {
    
  
const adminData = await User.findOne({is_admin:1});
const orders = await Order.find();

    const productWiseOrdersArray = [];

    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId;

        
        const product = await Product.findById(productId).select(
          "name image price"
        );
        const userDetails = await User.findById(order.userId).select(
          "name"
        );
        // console.log("wwwwwwww::"+product);
        if (product) {
          // Push the order details with product details into the array
          // orderDate = await formatDate(order.orderDate);
          productWiseOrdersArray.push({
            user: userDetails,
            product: product,
            orderDetails: {
              _id: order._id,
              userId: order.userId,
              shippingAddress: order.shippingAddress,
              orderDate: order.orderDate,
              totalAmount: productInfo.quantity * product.price,
              OrderStatus: productInfo.OrderStatus,
              StatusLevel: productInfo.StatusLevel,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
              quantity: productInfo.quantity,
            },
          });
        }
      }
    }
    // console.log(productWiseOrdersArray);
res.render("ordersDash",{admin:adminData,products:productWiseOrdersArray});
}
 catch (error) {
    console.log(error.message);
}
}
//=====order status changing=========

const orderManage = async(req,res)=>{
try {
  

  const orderDatas = await Order.findOne({_id:req.query.orderID});
  // console.log("From Order Manage Oage : "+orderDatas);
  const productDatas =await Product.findOne({_id:req.query.productID})
    // console.log("From Order Manage Oage : "+productDatas);


  res.render("orderManagePage",{odrDatas:orderDatas,prodDatas:productDatas});
} catch (error) {
  console.log(error.message);
}
}

//====orders status change==========

//===exports===========================

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    adminDashboard,
    insertProduct,
    loadProductAdd,
    loadCategoryAdd,
    insertCategory,
    userBlock,
    loadUserEdit,
    loadProductEdit,
    updateEdit,
    productUnlist,
    updateProductEdit,
    categoryUnlist,
    searchEasy,
    productDash,
    UserDash,
    categoryDash,
    ordersListing,
    orderManage          
    
}
