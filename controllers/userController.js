const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/userCartModel");
const Address = require("../models/userAddressModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
// const secret = require("../.env/secret");
require("dotenv").config();

let otp;

//======================================================password bcrypting
const securePassword = async (password) => {
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
//========================================================send otp through mail
const sendVerifyMail = async (name, email) => {
  try {
    otp = generateOTP();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.googleEmailSecret,
        pass: process.env.googlePassSecret,
      },
    });
    const mailOptions = {
      from: proccess.env.googleEmailSecret,
      to: email,
      subject: "For veryfication email",
      html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">SmartBuy</a>
              </div>
              <p style="font-size:1.1em">Hi, ${name}</p>
              <p>Thank you for choosing SmartBuy Gadget Store. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
              <p style="font-size:0.9em;">Regards,<br />SmartBuy</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Project by Shabin</p>
              </div>
            </div>
          </div>`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email ented ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
//=========================================================otp generating
const generateOTP = (length = 6) => {
  return [...new Array(length)].reduce(function (a) {
    return a + Math.floor(Math.random() * 10);
  }, "");
};
//==========================================================verify otp
const verifyOTP = async (req, res) => {
  try {
    if (req.query.userid) {
      // console.log(req.query.userid);
      res.render("emailVerification", { wrong: 1, userid: req.query.userid });
    } else {
      // console.log(req.body);
      let { a, b, c, d, e, f } = req.body;
      // console.log(req.query.id);
      let userOTP = a + b + c + d + e + f;
      if (!otp) {
        console.log("no stored otp");
      }
      // console.log(otp);
      // console.log(userOTP);
      if (userOTP == otp) {
        console.log("otp matched");
        const updateInfo = await User.updateOne(
          { _id: req.query.id },
          { $set: { is_verified: 1 } }
        );
        // console.log(updateInfo);
        res.render("emailVerification", { wrong: 0 });
      } else {
        console.log("otp not matched");
        res.render("emailVerification", { wrong: 2 });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
//===============================================================resend otp
const resendOTP = async (req, res) => {
  try {
    const userResendID = req.query.id;
    // console.log(userResendID);
    const userData = await User.findOne({ _id: userResendID });
    if (userData) {
      sendVerifyMail(userData.name, userData.email);
      res.render("otpPage", { userData });
    } else {
      console.log("resend otp error and email sending error");
    }
  } catch (error) {
    console.log(error.messaage);
  }
};
//===========================================================load register or signup page

const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};
//============================================================inserting user
const insertUser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.render("registration", {
        message: "Email already exists. Please use a different.",
      });
    }
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
    });
    const userData = await user.save();
    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id);

      res.render("otpPage", { userData });
    } else {
      res.render("registration", {
        message: "your registration has been failed",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//===================================================load product listing page
const loadProductListingPage = async (req, res) => {
  try {
    const productDatas = await Product.find({});
    res.render("productListing", { products: productDatas });
  } catch (error) {
    console.log(error.message);
  }
};
//=========================================================load product details
const lodadProductDetails = async (req, res) => {
  try {
    const productDetails = await Product.findOne({ _id: req.query.id });
    // console.log(productDetails);
    res.render("product", { product: productDetails });
  } catch (error) {
    console.log(error.message);
  }
};
//===lead login===
const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};
//===============================================================verify logins
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.is_blocked === 0) {
        req.session.user_id = userData._id;
        req.session.user = userData.name;
        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (passwordMatch) {
          if (userData.is_verified === 0) {
            res.render("login", { message: "Please verify your email" });
          } else {
            res.redirect("/home");
          }
        } else {
          res.render("login", { message: "Email and password are incorrect" });
        }
      } else {
        // Account is blocked
        res.render("login", {
          message: "Your account is temporarily suspended",
        });
      }
    } else {
      // User not found
      res.render("login", { message: "Email and password are incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//========================================================load home
const loadHome = async (req, res) => {
  try {
    const productData = await Product.find({ is_unlisted: 0 });
    if (req.session.user_id) {
      let userData = await User.findOne({ _id: req.session.user_id });
      res.render("home", {
        user: req.session.user,
        products: productData,
        userData,
      });
    } else {
      let userData = await User.findOne({ _id: req.session.user_id });
      res.render("home", { user: req.session.user, products: productData });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//=======================================================user logout
const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};
//==================================================load product
const loadProduct = async (req, res) => {
  try {
    res.render("product");
  } catch (error) {
    console.log(error.message);
  }
};
//=================================================add to cart
const addToCart = async (req, res) => {
  try {
    // console.log(req.body.id);
    // console.log(req.body.user);
    const userId = req.session.user_id;
    // console.log("userID:"+userId);
    const existingCart = await Cart.findOne({ user_id: userId });
    // console.log(existingCart);
    if (!existingCart) {
      // console.log("no cart called..");
      const cart = new Cart({
        user_id: userId,
        products: [
          {
            product: req.body.id,
            quantity: 1,
          },
        ],
      });

      let result = await cart.save();
      // console.log(result);
      res.json({ cart: 1 });
    } else {
      const productInCart = existingCart.products.find(
        (item) => item.product.toString() === req.body.id.toString()
      );

      if (productInCart) {
        res.json({ cart: 2 });
      } else {
        existingCart.products.push({
          product: req.body.id,
          quantity: 1,
        });
        res.json({ cart: 1 });
      }
      const result = await existingCart.save();
      // console.log("Product added to cart:", result);
    }

    res.json({ cart: 0 });
    // console.log(result);
  } catch (error) {
    console.log(error.message);
  }
};
//========================================add user address
const addAddress = async (req, res) => {
  const userId = req.session.user_id;
  const addressData = req.body;

  try {
    console.log(addressData.name);
    const existingUser = await Address.findOne({ user_id: userId });

    let newAddress;

    if (!existingUser) {
      newAddress = new Address({
        user_id: userId,
        address: [
          {
            fullName: addressData.name,
            country: addressData.country,
            mobileNo: addressData.mobn,
            pincode: addressData.pin,
            city: addressData.city,
            state: addressData.state,
          },
        ],
      });
    } else {
      newAddress = existingUser;
      newAddress.address.push({
        fullName: addressData.name,
        country: addressData.country,
        mobileNo: addressData.mobn,
        pincode: addressData.pin,
        city: addressData.city,
        state: addressData.state,
      });
    }

    const savedAddress = await newAddress.save();
    // console.log("Address added:", savedAddress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
//==============================load user address add page
const loadAddressUploadPage = async (req, res) => {
  try {
    res.render("addressAdding");
  } catch (error) {
    console.log(error.message);
  }
};

//--------------------------------------------calculation
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

//==================================================after the placing order
//////////this is moved into order controll

// const orderPlaceClicked = async (req,res)=>{
// try {
//   const combinedData = req.body;
//   // console.log(combinedData);
//   const selectedAddress = combinedData.selectedData; 
//   const selectedPaymentMethod = combinedData.selectedPaymentOptions; 
//   console.log(selectedAddress);
//   // console.log(typeof(selectedAddress));
//  const deliveryUserAddress = await Address.findOne({user_id:req.session.user_id});
// //  console.log(deliveryUserAddress);
//  const targetAddress = deliveryUserAddress.address.find((address) => address._id == selectedAddress);
//  console.log(targetAddress);


//   if(!combinedData){
//     console.log("selcted payment and address not reached in usercontroller")
//   }else{
//     // console.log("rendering order placed page");
    
//   }
// } catch (error) {
//   console.log(error.message);
// }
// }
//=================================================load cart page
const loadCartPage = async (req, res) => {
  try {
    const userCart = await Cart.findOne({ user_id: req.session.user_id })
      .populate({
        path: "products.product",
        model: "Product",
        select: "name price description image",
      })
      .exec();

    if (userCart) {
      let total = await calculateTotalPrice(req.session.user_id);
      res.render("userCart", { products: userCart.products, total,user_id: req.session.user_id });
      // console.log(userCart.products);
    }else{
      res.render("userCart",{products:0});
    }
  } catch (error) {
    console.log(error.message);
  }
};
//==============================================cart quantity and price
const changeProductQuantity = async (userId,productId,newQuantityChange)=>{
  try{
    
  const cart = await Cart.findOne({user_id:userId});
  // console.log(cart);

  if(!cart){
    console.log("user does not have a cart");
    return;
  }

  const productInCart = cart.products.find(
    (cartProduct)=>cartProduct.product.toString()===productId.toString()
  );

  if(!productInCart){
    console.log("Product not found in the cart");
    return;
  }
  const currentQuantity = productInCart.quantity;
  const newQuantity = currentQuantity+newQuantityChange;

  if(newQuantity<1){
    console.log("Quantity cannot be less than 1")
    return;
  }

  if(newQuantity>5){
    console.log("Quantity cannot be greater than 5")
    return;
  }

  productInCart.quantity = newQuantity;

  let result = await  cart.save();
  return result;
}catch(error){
  console.log(error.message);
}
}

//============================================== update quantity real
const productQuantityHandling = async(req,res)=>{
  try {
    // console.log(req.body);
    if(!req.session.user_id){
      res.json({user:0});
    }else{
      let{userId,productId,qty}=req.body;
      qty = Number(qty);
      // console.log(qty);

      let qtyChange = await changeProductQuantity(userId,productId,qty);
      const cartDetails = await Cart.findOne({user_id:userId});
     total = await calculateTotalPrice(userId);
      res.json({cartItems:cartDetails,total});
    }
  } catch (error) {
    console.log(error.message);
  }
}
//============================================remove items from the cart
const removeProductFromCart = async (req, res) => {
  try {
    const productId = req.params.productId;

    const existingUserCart = await Cart.findOne({ user_id: req.session.user_id });

    if (!existingUserCart) {
      console.log("This user's cart does not exist.");
      return res.status(404).json({ success: false, message: "User's cart does not exist." });
    }

    // Use await for findOneAndUpdate and store the result
    const result = await Cart.findOneAndUpdate(
      { user_id: req.session.user_id },
      { $pull: { products: { product: productId } } },
      { new: true } // To get the updated cart after removal
    );

    if (result) {
      res.json({removed:1})
    } else {
      console.log('Product not found in the cart.');
      return res.status(404).json({ success: false, message: 'Product not found in the cart.' });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: 'Error while removing product from the cart.' });
  }
};
//==============================================load user profile
const loadUserProfile = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.session.user_id });
    res.render("userProfile", { userData });
  } catch (error) {
    console.log(error.message);
  }
}; //======================================== load delivery address page
const loadcheckoutPage = async (req, res) => {
  try {


    const usersAddresses = await Address.findOne({ user_id: req.session.user_id });
    // console.log(usersAddresses.address);
    const totalamount = req

    if (usersAddresses) {
      res.render("checkoutPage", { addresses: usersAddresses.address });
      // console.log(usersAddresses.address)
    } else {
      console.log("User's addresses not found.");
      res.render("checkoutPage", { addresses: [] });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
//=================================================user edit
const loadUserEdit = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    if (userData) {
      res.render("editUserData", { user: userData });
    } else {
      res.redirect("dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};
const updateEdit = async (req, res) => {
  try {
    if (req.file) {
      const userUpdatedData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            image: req.file.filename,
            address: req.body.address,
            pincode: req.body.pincode,
          },
        }
      );
    } else {
      const userUpdatedData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            address: req.body.address,
            pincode: req.body.pincode,
          },
        }
      );
    }
  } catch (error) {
    console.log(error.message);
  }
};
//=====================END=================================//

module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  sendVerifyMail,
  loadHome,
  userLogout,
  loadProduct,
  verifyOTP,
  lodadProductDetails,
  resendOTP,
  loadProductListingPage,
  loadCartPage,
  loadUserProfile,
  loadUserEdit,
  updateEdit,
  addToCart,
  loadcheckoutPage,
  loadAddressUploadPage,
  addAddress,
  productQuantityHandling,
  removeProductFromCart
};
