const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/userCartModel");
const Address = require("../models/userAddressModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Wishlist = require("../models/userWishlistModel");
const Swal = require("sweetalert2");
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
        user: process.env.googleEmailSecret.trim(),
        pass: process.env.googlePassSecret.trim(),
      },
    });
    const mailOptions = {
      from: process.env.googleEmailSecret,
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
      return res.render("emailVerification", {
        wrong: 1,
        userid: req.query.userid,
      });
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
        // console.log("otp matched");
        const updateInfo = await User.updateOne(
          { _id: req.query.id },
          { $set: { is_verified: 1 } }
        );
        // console.log(updateInfo);
        return res.render("emailVerification", { wrong: 0 });
      } else {
        // console.log("otp not matched");
        return res.render("emailVerification", { wrong: 2 });
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
      return res.render("otpPage", { userData });
    } else {
      // console.log("resend otp error and email sending error");
    }
  } catch (error) {
    console.log(error.messaage);
  }
};
//===========================================================load register or signup page

const loadRegister = async (req, res) => {
  try {
    return res.render("registration");
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
        message: "Email already exists. Please use a different one.",
      });
    }

    let walletUpdateRegr = 0;
    const reffCode = req.body.rfferelCode;
    if (reffCode) {
      const reffCodeUser = await User.findOne({ toReffer: reffCode });
      if (reffCodeUser) {
        await User.updateOne({ _id: reffCodeUser._id }, { $inc: { wallet: 50 } });
        walletUpdateRegr = 20;
      }
    }
    function generateRandomNineDigitNumber() {
            const min = 100000000;
            const max = 999999999; 
            const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            return randomNumber;
          }

    const referelNumber = generateRandomNineDigitNumber();

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      toReffer: referelNumber,
      wallet: walletUpdateRegr,
      refOffer: req.body.rfferelCode,
      is_admin: 0,
    });

    const userData = await user.save();

    if (!userData) {
      return res.render("registration", {
        message: "Your registration has failed",
      });
    }

    const newUserID = await User.findOne({ email: req.body.email });
    if (walletUpdateRegr) {
      await User.updateOne({ _id: newUserID._id }, { $inc: { wallet: walletUpdateRegr } });
    }

    sendVerifyMail(req.body.name, req.body.email, userData._id);
    return res.render("otpPage", { userData });
  } catch (error) {
    console.log(error.message);
  }
};

// const insertUser = async (req, res) => {
//   try {
//     const spassword = await securePassword(req.body.password);
//     let walletUpdateRegr;
//     const existingUser = await User.findOne({ email: req.body.email });
//     if (existingUser) {
//       return res.render("registration", {
//         message: "Email already exists. Please use a different.",
//       });
//     }
//     if(req.body.rfferelCode != ""){
//       const reffCode = await User.findOne({toReffer:req.body.rfferelCode});
//       if(reffCode){
//         const walletUpdate = await User.updateOne(
//           { _id: reffCode._id },
//           { $inc: { wallet: 50 } }
//         );
//       }
      
//       if(reffCode){
//         walletUpdateRegr = 20; 
//       }else{
//         walletUpdateRegr = 0;
//       }

//     }
//     function generateRandomNineDigitNumber() {
//       const min = 100000000;
//       const max = 999999999;
      
//       // Generate a random number within the specified range
//       const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    
//       return randomNumber;
//     }
//     const referelNumber = generateRandomNineDigitNumber()
//     const user = new User({
//       name: req.body.name,
//       email: req.body.email,
//       mobile: req.body.mno,
//       password: spassword,
//       toReffer : referelNumber,
//       wallet:walletUpdateRegr,
//       refOffer:req.body.rfferelCode,
//       is_admin: 0,
//     });
//     const userData = await user.save();
//     const newUserID = await User.findOne({email:req.body.email})
//     const walletUpdate = await User.updateOne(
//       { _id: newUserID._id },
//       { $inc: { wallet: walletUpdateRegr } }
//     );
//     console.log(walletUpdate);
//     if (userData) {
//       sendVerifyMail(req.body.name, req.body.email, userData._id);

//       return res.render("otpPage", { userData });
//     } else {
//       res.render("registration", {
//         message: "your registration has been failed",
//       });
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };

//===================================================load product listing page

const loadProductListingPage = async (req, res) => {
  try {
    // Sorting
    const category = req.query.array1 ? req.query.array1.split(",") : [];
    const brand = req.query.array2 ? req.query.array2.split(",") : [];
    const searchQuery = req.query.q || "";

    const matchCriteria = {};

    if (category.length > 0) {
      matchCriteria.category = { $in: category };
    }

    if (brand.length > 0) {
      matchCriteria.sellername = { $in: brand };
    }

    // Add search criteria
    if (searchQuery) {
      matchCriteria.$or = [
        { name: { $regex: new RegExp(searchQuery, "i") } },
        { description: { $regex: new RegExp(searchQuery, "i") } },
        // Add other fields you want to search here
      ];
    }

    const filteredDocs = await Product.aggregate([
      {
        $match: matchCriteria,
      },
    ]).exec();

    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const productDatas = await Product.find()
      .where("_id")
      .in(filteredDocs.map((product) => product._id))
      .limit(limit)
      .skip(skip)
      .exec();

    const totalPage = Math.ceil(filteredDocs.length / limit);

    return res.render("productListing", {
      products: productDatas,
      curentPage: Number(page),
      totalPage,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

//=========================================================load product details
const lodadProductDetails = async (req, res) => {
  try {
    const productDetails = await Product.findOne({ _id: req.query.id });
    // console.log(productDetails);
    return res.render("product", { product: productDetails });
  } catch (error) {
    console.log(error.message);
  }
};
//===lead login===
const loginLoad = async (req, res) => {
  try {
    return res.render("login");
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
            return res.render("login", { message: "Please verify your email" });
          } else {
            return res.redirect("/home");
          }
        } else {
          return res.render("login", {
            message: "Email and password are incorrect",
          });
        }
      } else {
        // Account is blocked
        return res.render("login", {
          message: "Your account is temporarily suspended",
        });
      }
    } else {
      // User not found
      return res.render("login", {
        message: "Email and password are incorrect",
      });
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
      return res.render("home", {
        user: req.session.user,
        products: productData,
        userData,
      });
    } else {
     
      return res.render("home", {
        user: 0,
        products: productData,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//=======================================================user logout
const userLogout = async (req, res) => {
  try {
    req.session.user_id = null
    
    // req.session.destroy();
    return res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};
//==================================================load product
const loadProduct = async (req, res) => {
  try {
    return res.render("product");
  } catch (error) {
    console.log(error.message);
  }
};
//=================================================add to cart
const addToCart = async (req, res) => {
  try {
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

      await cart.save();

      //clear product from wishlist
      const haveWishlist = await Wishlist.findOne({
        user_id: req.session.user_id,
      });
      if (haveWishlist) {
        const romoving = await Wishlist.findOneAndUpdate(
          { user_id: req.session.user_id },
          { $pull: { products: { product: req.body.id } } },
          { new: true }
        );
        console.log(romoving);
      } else {
        console.log("this product not in wishlist");
      }

      return res.json({ cart: 1 });
    } else {
      const productInCart = existingCart.products.find(
        (item) => item.product.toString() === req.body.id.toString()
      );

      if (productInCart) {
        return res.json({ cart: 2 });
      } else {
        existingCart.products.push({
          product: req.body.id,
          quantity: 1,
        });
        res.json({ cart: 1 });
      }
      const result = await existingCart.save();
      //clear product from wishlist
      const haveWishlist = await Wishlist.findOne({
        user_id: req.session.user_id,
      });
      if (haveWishlist) {
        const romoving = await Wishlist.findOneAndUpdate(
          { user_id: req.session.user_id },
          { $pull: { products: { product: req.body.id } } },
          { new: true }
        );
        // console.log(romoving);
      } else {
        console.log("this product not in wishlist");
      }
    }

    // console.log("produnct id"+req.body.id)
    const producntQuantity = await Product.findOneAndUpdate(
      { _id: req.body.id },
      { $inc: { stock: -1 } }
    );
    // console.log("stock is now : " + producntQuantity.stock);

    return res.json({ cart: 0 });
    // console.log(result);
  } catch (error) {
    console.log(error.message);
  }
};
//========================================add user address
const addAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressData = req.body;
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
    return res.status(500).json({ message: "Server error" });
  }
};

//==============================load user address add page
const loadAddressUploadPage = async (req, res) => {
  try {
    return res.render("addressAdding");
  } catch (error) {
    console.log(error.message);
  }
};

//user shipping address add
const loadUserShipAddress = async (req, res) => {
  try {
    const userID = req.session.user_id;

    const userData = await User.findOne({ _id: userID });
    return res.render("shipAddressAdd", { userData });
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

//=================================================load cart page
const loadCartPage = async (req, res) => {
  try {
    const userCart = await Cart.findOne({ user_id: req.session.user_id })
      .populate({
        path: "products.product",
        model: "Product",
        select: "name price description image1",
      })
      .exec();

    if (userCart) {
      let total = await calculateTotalPrice(req.session.user_id);
      return res.render("userCart", {
        products: userCart.products,
        total,
        user_id: req.session.user_id,
      });
    } else {
      let total = 0;
      return res.render("userCart", { products: 0, total });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//==============================================cart quantity and price
const changeProductQuantity = async (userId, productId, newQuantityChange) => {
  try {
    const cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      // console.log("User does not have a cart");
      return;
    }

    const productInCart = cart.products.find(
      (cartProduct) => cartProduct.product.toString() === productId.toString()
    );

    if (!productInCart) {
      // console.log("Product not found in the cart");
      return;
    }

    const currentQuantity = productInCart.quantity;
    const newQuantity = currentQuantity + newQuantityChange;

    if (newQuantity < 1) {
      // console.log("Quantity cannot be less than 1");
      return;
    }

    if (newQuantity > 5) {
      // console.log("Quantity cannot be greater than 5");
      return;
    }

    // Calculate the change in quantity
    const quantityChange = newQuantity - currentQuantity;

    // Find the product in the database
    const product = await Product.findOne({ _id: productId });

    if (!product) {
      // console.log("Product not found in the database");
      return;
    }

    // Calculate the stock change based on quantity change
    const stockChange = -quantityChange; // Increase stock when quantity decreases

    if (product.stock + stockChange < 0) {
      // console.log("Insufficient stock");
      return;
    }

    // Update the product's stock in the database
    product.stock += stockChange;
    await product.save();

    // Update the cart to reflect the new quantity
    productInCart.quantity = newQuantity;
    const result = await cart.save();

    // console.log("Cart and product stock updated successfully");
    return result;
  } catch (error) {
    console.log(error.message);
  }
};

//============================================== update quantity real
const productQuantityHandling = async (req, res) => {
  try {
    // console.log(req.body);
    if (!req.session.user_id) {
      return res.json({ user: 0 });
    } else {
      let { userId, productId, qty } = req.body;
      qty = Number(qty);
      // console.log(qty);

      let qtyChange = await changeProductQuantity(userId, productId, qty);
      const cartDetails = await Cart.findOne({ user_id: userId });
      total = await calculateTotalPrice(userId);
      return res.json({ cartItems: cartDetails, total });
    }
  } catch (error) {
    console.log(error.message);
  }
};
//============================================remove items from the cart
const removeProductFromCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const existingUserCart = await Cart.findOne({
      user_id: req.session.user_id,
    });

    if (!existingUserCart) {
      // console.log("This user's cart does not exist.");
      return res
        .status(404)
        .json({ success: false, message: "User's cart does not exist." });
    }

    const product = await Cart.findOne({ user_id: req.session.user_id });
    // console.log("this is product" + product);

    // console.log(req.params.productId);
    const qnty = product.products.find((product) => {
      return product.product == req.params.productId;
    });
    const totalQuantity = qnty.quantity;
    // console.log("Quantity : "+totalQuantity);

    const result = await Cart.findOneAndUpdate(
      { user_id: req.session.user_id },
      { $pull: { products: { product: productId } } },
      { new: true }
    );

    if (result) {
      const producntQuantity = await Product.findOneAndUpdate(
        { _id: req.params.productId },
        { $inc: { stock: 1 } }
      );

      // console.log("stock is now : " + producntQuantity.stock);
      return res.json({ removed: 1 });
    } else {
      // console.log("Product not found in the cart.");
      return res
        .status(404)
        .json({ success: false, message: "Product not found in the cart." });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Error while removing product from the cart.",
    });
  }
};
//==============================================load user profile

const loadUserProfile = async (req, res) => {
  try {
    let userData = await User.findOne({ _id: req.session.user_id });
    let addrs = []; // Initialize addrs as an empty array

    const shippAddr = await Address.findOne({ user_id: req.session.user_id });
    if (shippAddr && shippAddr.address) {
      addrs = shippAddr.address; // Update addrs if shipping addresses are found
    }

    return res.render("userProfile", { userData, addrs });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

//======================================== load delivery address page
const loadcheckoutPage = async (req, res) => {
  try {
    const usersAddresses = await Address.findOne({
      user_id: req.session.user_id,
    });
    // console.log(usersAddresses.address);
    const totalamount = await calculateTotalPrice(req.session.user_id);

    if (usersAddresses && !totalamount == 0) {
      return res.render("checkoutPage", {
        addresses: usersAddresses.address,
        totalamount,
      });
      // console.log(usersAddresses.address)
    } else {
      // console.log("User's addresses not found.");
      return res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error");
  }
};
//=================================================user edit
const loadUserEdit = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    if (userData) {
      return res.render("editUserData", { user: userData });
    } else {
      return res.redirect("dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//update user edit
const updateEdit = async (req, res) => {
  try {
    let userUpdatedData;
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
      userUpdatedData = await User.findByIdAndUpdate(
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
//wishlist
const leadWishList = async (req, res) => {
  try {
    const whishListDatas = await Wishlist.findOne({
      user_id: req.session.user_id,
    })
      .populate({
        path: "products.product",
        model: "Product",
        select: "name price description image1",
      })
      .exec();
    // console.log(whishListDatas.products);
    res.render("wishlist", { products: whishListDatas.products });
  } catch (error) {
    console.log(error.message);
  }
};
//add to wish list
const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    // console.log("userID:"+userId);
    const existingWishlist = await Wishlist.findOne({ user_id: userId });
    // console.log(existingCart);
    if (!existingWishlist) {
      const wishlist = new Wishlist({
        user_id: userId,
        products: [
          {
            product: req.body.id,
            quantity: 1,
          },
        ],
      });

      let result = await wishlist.save();

      return res.json({ wish: 1 });
    } else {
      const productInWishlist = existingWishlist.products.find(
        (item) => item.product.toString() === req.body.id.toString()
      );

      if (productInWishlist) {
        return res.json({ wish: 2 });
      } else {
        existingWishlist.products.push({
          product: req.body.id,
          quantity: 1,
        });
        res.json({ wish: 1 });
      }
      const result = await existingWishlist.save();

    }

    return res.json({ wish: 0 });
    // console.log(result);
  } catch (error) {
    console.log(error.message);
  }
};

//remove wishlist
const removefromWishList = async (req, res) => {
  try {
    const prodIDtoRemove = req.body.id;

    const checkWishExist = await Wishlist.findOne({
      user_id: req.session.user_id,
    });
    if (checkWishExist) {
      const removing = await Wishlist.findOneAndUpdate(
        { user_id: req.session.user_id },
        { $pull: { products: { product: prodIDtoRemove } } },
        { new: true }
      );

      if (removing) {
        return res.json({ removed: 1 });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
//wallet
const loadWalled = async (req, res) => {
  try {
const userData = await User.findOne({_id:req.session.user_id});
console.log(userData);
    res.render("wallet",{userData});
  } catch (error) {
    console.log(error.message);
  }
};

//edit ship address
const editShipAddress = async (req, res) => {
  try {
    const addressID = req.query.id;
    const editingAddress = await Address.findOne({
      user_id: req.session.user_id,
    });
    const addrs = editingAddress.address.find(
      (address) => address._id == addressID
    );
    res.render("editShipAddress", { addrs });
  } catch (error) {
    console.log(error.message);
  }
};
//update edited shipaddress
const updtShpAddr = async (req, res) => {
  try {
    const editedData = req.body;

    const address = await Address.findOne({ user_id: req.session.user_id });
    const editedDat = await Address.findOneAndUpdate(
      { "address._id": req.body.id },
      {
        $set: {
          "address.$.country": req.body.country,
          "address.$.fullName": req.body.name,
          "address.$.mobileNo": req.body.mobn,
          "address.$.pincode": req.body.pin,
          "address.$.city": req.body.city,
          "address.$.state": req.body.state,
        },
      }
    );
    if (editedDat != null) {
      res.redirect("userProfile");
    }
  } catch (error) {
    console.log(error.message);
  }
};
//romove shipAddress
const rmvShpAdr = async (req, res) => {
  try {
    const addrID = req.query.id;
    const addrToRmv = await Address.findOneAndUpdate(
      { "address._id": addrID, user_id: req.session.user_id },
      { $pull:{'address':{_id:addrID}} },
      {new:true}
    );
    res.send("removed successfully");

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
  removeProductFromCart,
  leadWishList,
  addToWishlist,
  removefromWishList,
  loadWalled,
  loadUserShipAddress,
  editShipAddress,
  updtShpAddr,
  rmvShpAdr,
};
