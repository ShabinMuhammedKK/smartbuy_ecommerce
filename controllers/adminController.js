const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");
const Transaction = require("../models/transationModel");
const bcrypt = require("bcrypt");
const Funcs = require("../public/assets/comfuncs.js/funcs");
const sharp = require("sharp");
const OfferController = require("../controllers/offerController");
const Offer = require("../models/offerModel");
const puppeteer = require("puppeteer")

//=======================================user controller==================

const loadLogin = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin === 0) {
          return res.render("login", {
            message: "Email or password is incorrect",
          });
        } else {

          req.session.admin_id = userData._id;
          return res.redirect("/admin/dashboard");
        }
      } else {
        return res.render("login", {
          message: "Email or password is incorrect",
        });
      }
    } else {
      return res.render("login", { message: "Email or password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.admin_id });
    return res.render("home", { admin: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.admin_id=null
    // req.session.destroy();
    return res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  try {
    const adminData = await User.findOne({ is_admin: 1 });
    const ProductStock = await Funcs.productStock(Product); //array
    const Transactions = await Funcs.transacHistory(Transaction); //array
    const OrderListing = await Funcs.orderListing(Order); //array

    if (adminData && ProductStock && Transactions && OrderListing) {
      return res.render("dashboard", {
        admin: adminData,
        ProductStock,
        Transactions,
        OrderListing,
      });
    } else {
      return console.log(error.message);
    }
  } catch (error) {
    return console.log(error.message);
  }
};

//------------------------------user edit

const loadUserEdit = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      const userData = await User.findById({ _id: id });
      if (userData) {
        return res.render("editUserData", { user: userData });
      } else {
        return res.redirect("dashboard");
      }
    } else console.log(error.message);
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
          },
        }
      );
    }
  } catch (error) {
    console.log(error.message);
  }
};
//------------------------product edit

const loadProductEdit = async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      const productData = await Product.findById({ _id: id });
      console.log("hello 123"+productData);
      const category = await Category.find();
      if (productData) {
        return res.render("editProductData", {
          product: productData,
          category,
        });
      } else {
        return res.redirect("dashboard");
      }
    } else console.log(error.message);
  } catch (error) {
    console.log(error.message);
  }
};
//percentage calculation
function calculatePercentageChange(existPrice, offPerce) {
  const percentageChange = (existPrice / 100) * Math.abs(offPerce);
  return percentageChange;
}

//product edit
const updateProductEdit = async (req, res) => {
  try {
    // Check if files are present for each image field
    const image1 = req.files["image1"]
      ? req.files["image1"][0].filename
      : undefined;
    const image2 = req.files["image2"]
      ? req.files["image2"][0].filename
      : undefined;
    const image3 = req.files["image3"]
      ? req.files["image3"][0].filename
      : undefined;
    const image4 = req.files["image4"]
      ? req.files["image4"][0].filename
      : undefined;
    const image5 = req.files["image5"]
      ? req.files["image5"][0].filename
      : undefined;

    let priceOfProduct;
    let priceOfProduct1;
    let toReducePrice;
    
    if (req.body.offerID != "") {

      const offerValidity = Offer.findOne({offerID:req.body.offerID})
      if(offerValidity){
        const currentDate = new Date();
        //date validity checking
        if (currentDate < offerValidity.startDate || currentDate > offerValidity.endDate) {
          return res.json({ valid: false, message: "offer is out of date" });
        }
        

      }
      const fieldValue = req.body.offerID;
      const checkOfferIn = await Offer.findOne({ offerID: fieldValue });
      if (checkOfferIn != null) {
        toReducePrice = calculatePercentageChange(req.body.price,checkOfferIn.offerPercentage);
        priceOfProduct = req.body.price - toReducePrice;
      }
    } else {
      priceOfProduct=req.body.basePrice;
    }
  

    const updateObject = {
      name: req.body.name,
      basePrice:req.body.basePrice,
      description: req.body.description,
      sellername: req.body.sellername,
      stock: req.body.stock,
      category: req.body.category,
      price: priceOfProduct,
      appliedOfferID: req.body.offerID,
    };

    // Add image fields to the update object if files were uploaded
    if (image1) updateObject.image1 = image1;
    if (image2) updateObject.image2 = image2;
    if (image3) updateObject.image3 = image3;
    if (image4) updateObject.image4 = image4;
    if (image5) updateObject.image5 = image5;

    // Update the product using the Product model
    const productUpdatedData = await Product.findByIdAndUpdate(
      { _id: req.body.product_id },
      { $set: updateObject },
      { new: true } // To return the updated product
    );

    if (productUpdatedData) {
      return res.redirect("/admin/dashboard#productsData");
    } else {
      return res.render("addProduct", {
        message: "Product can't be updated",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: error.message }); // Handle errors
  }
};

//===search bar===========================================

const searchEasy = async (req, res) => {
  try {
    const adminData = await User.findOne({ is_admin: 1 });
    let searchDatas = await searchBarData(req.body.searches);
    return res.render("dashboard", { users: searchDatas, admin: adminData });
  } catch (error) {
    console.log(error.message);
  }
};

const searchBarData = async (searches) => {
  try {
    let searchDetaills = await User.find({
      $or: [
        { name: { $regex: searches } },
        { mobile: { $regex: searches } },
        { email: { $regex: searches } },
      ],
    });
    return searchDetaills;
  } catch (error) {
    console.log(error.message);
  }
};

//==============================PRODUCT CONTROLLER===========================

const loadProductAdd = async (req, res) => {
  try {
    const categoryDatas = await Category.find();
    return res.render("addProduct", { category: categoryDatas });
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

    for (let i = 0; i < imageFilenames.length; i++) {
      await sharp("public/userImages/" + imageFilenames[i])
        .resize(250, 250)
        .toFile("public/crop/" + imageFilenames[i]);
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      basePrice: req.body.price,
      price: req.body.price,
      image1: imageFilenames[0],
      image2: imageFilenames[1],
      image3: imageFilenames[2],
      image4: imageFilenames[3],
      image5: imageFilenames[4],
      stock: req.body.stock,
      sellername: req.body.sellername,
      category: req.body.category,
    });
    const productData = await product.save();

    if (productData) {
      return res.redirect("/admin/dashboard#productsData");
    } else {
      return res.render("addProduct", {
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
    return res.render("addCategory");
  } catch (error) {
    console.log(error.message);
  }
};

const insertCategory = async (req, res) => {
  try {
    const categoryName = req.body.category.trim().toLowerCase();

    const existingCategory = await Category.findOne({ forIdentity: categoryName });

    if (existingCategory) {
      return res.render("addCategory", {
        message: "Category already exists",
      });
    }else{

    const category = new Category({
      category: req.body.category,
      description: req.body.description,
      forIdentity:categoryName
    });
    const categoryData = await category.save();

    if (categoryData) {
      return res.render("addCategory", {
        message: "Your category is added",
      });
    } else {
      return res.render("addCategory", {
        message: "Category cano't add",
      });
    }
  }
  } catch (error) {
    console.log(error.message);
  }
};
//Edit category
const loadEditCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.query.id });
    res.render("editCategory", { category });
  } catch (error) {
    console.log(error.message);
  }
};

const updateCategory = async (req, res) => {
  try {

    if (req.body.offerID != "") {
      console.log(req.body.offerID);
      const fieldValue = req.body.offerID;
      const checkOfferIn = await Offer.findOne({ offerID: fieldValue });
      if(checkOfferIn){
      const categoryID = req.body.id;
      const category = await Category.findOneAndUpdate(
        { _id: categoryID },
        {
          $set: {
            category: req.body.name,
            description: req.body.description,
            appliedOfferID: req.body.offerID,
          },
        }
      );
      if (category) {
  
        const categoryProducts = await Product.find({ category: req.body.name });
        const offerFind = await Offer.findOne({ offerID: req.body.offerID });
        const offerPercentage = offerFind.offerPercentage;
        for (const product of categoryProducts) {
          const newPrice = product.price * (1 - offerPercentage / 100);
          await Product.updateOne({ _id: product._id }, { $set: { price: newPrice } });
        }}
    }
  }else if(req.body.offerID == ""){
    const categoryID = req.body.id;
    const category = await Category.findOneAndUpdate(
      { _id: categoryID },
      {
        $set: {
          category: req.body.name,
          description: req.body.description,
          appliedOfferID: req.body.offerID,
        },
      }
    );
    if (category) {

      const categoryProducts = await Product.find({ category: req.body.name });
      for (const product of categoryProducts) {
        console.log("basePrice is : "+product.basePrice);
        await Product.updateOne({ _id: product._id }, { $set: { price: product.basePrice } });
      }}
  }
  } catch (error) {
    console.log(error.message);
  }
};

//====user block======================

const userBlock = async (req, res) => {
  try {
    let blockStatus = await User.findOne({ _id: req.body.id });
    if (blockStatus.is_blocked === 0) {
      let block = await User.updateOne(
        { _id: req.body.id },
        { $set: { is_blocked: 1 } }
      );
    } else {
      let unblock = await User.updateOne(
        { _id: req.body.id },
        { $set: { is_blocked: 0 } }
      );
    }

    let users = await User.find({});
    return res.json({ users: users });
  } catch (error) {
    console.log(error.message);
  }
};
//===product unlist==================

const productUnlist = async (req, res) => {
  try {
    let unlistStatus = await Product.findOne({ _id: req.body.id });
    if (unlistStatus.is_unlisted === 0) {
      const unlist = await Product.updateOne(
        { _id: req.body.id },
        { $set: { is_unlisted: 1 } }
      );
    } else {
      const list = await Product.updateOne(
        { _id: req.body.id },
        { $set: { is_unlisted: 0 } }
      );
    }

    const products = await Product.find({});
    return res.json({ products: products });
  } catch (error) {
    console.log(error.message);
  }
};

//======catogory unlist==================

const categoryUnlist = async (req, res) => {
  try {
    let unlistStatus = await Category.findOne({ _id: req.body.id });
    if (unlistStatus.is_unlisted === 0) {
      const unlist = await Category.updateOne(
        { _id: req.body.id },
        { $set: { is_unlisted: 1 } }
      );
    } else {
      const list = await Category.updateOne(
        { _id: req.body.id },
        { $set: { is_unlisted: 0 } }
      );
    }

    const category = await Category.find({});
    return res.json({ category: category });
  } catch (error) {
    console.log(error.message);
  }
};
//==========================================dashboard routing
const productDash = async (req, res) => {
  try {
    const adminData = await User.findOne({ is_admin: 1 });
    const productData = await Product.find();
    return res.render("productDash", {
      products: productData,
      admin: adminData,
    });
  } catch (error) {
    console.log(error.message);
  }
};
//============================================sales page routing
const salesDash = async (req, res) => {
  try {
    const adminData = await User.findOne({ is_admin: 1 });
    const interval = req.query.interval || "monthly"; // Get the selected interval from the request

    if (adminData) {
      const OrderProdQty = await Funcs.prodQty(Order, interval); // Pass the interval to prodQty
      return res.render("salesReport", {
        admin: adminData,
        OrderProdQty,
        interval
      });
    } else {
      console.log("Data not found");
    }
    return;
  } catch (error) {
    console.log(error.message);
    return;
  }
};

//IMAGE EDIT FROM PRODUCT EDIT
const imageEdit = async (req, res) => {
  try {
    const data = req.body.id;
    console.log(data);
    res.json({ response: "OK" });
    return;
  } catch (error) {
    console.log(error.message);
  }
};

//==================================user dash
const UserDash = async (req, res) => {
  try {
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    const usersData = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: ".*" + search + ".*" } },
        { mobile: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } },
      ],
    });
    const adminData = await User.findOne({ is_admin: 1 });
    return res.render("userDash", { users: usersData, admin: adminData });
  } catch (error) {
    console.log(error.message);
  }
};
const categoryDash = async (req, res) => {
  try {
    const adminData = await User.findOne({ is_admin: 1 });
    const categoryData = await Category.find();
    return res.render("categoryDash", {
      admin: adminData,
      category: categoryData,
    });
  } catch (error) {
    console.log(error.message);
  }
};
//=========orders listing===

const ordersListing = async (req, res) => {
  try {
    const adminData = await User.findOne({ is_admin: 1 });
    const orders = await Order.find();

    const productWiseOrdersArray = [];

    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId;

        const product = await Product.findById(productId).select(
          "name image1 price"
        );
        const userDetails = await User.findById(order.userId).select("name");
        // console.log("wwwwwwww::"+product);
        if (product) {
          // Push the order details with product details into the array
          // orderDate = await formatDate(order.orderDate);
          var totalAmount = Math.floor(productInfo.quantity * product.price);
          productWiseOrdersArray.push({
            user: userDetails,
            product: product,
            orderDetails: {
              _id: order._id,
              userId: order.userId,
              shippingAddress: order.shippingAddress,
              orderDate: order.orderDate,
              totalAmount: totalAmount,
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
    return res.render("ordersDash", {
      admin: adminData,
      products: productWiseOrdersArray,
    });
  } catch (error) {
    console.log(error.message);
  }
};
//=====order status changing=========

const orderManage = async (req, res) => {
  try {
    const orderDatas = await Order.findOne({ _id: req.query.orderID });
    const orderID = req.query.orderID;
    // console.log("order ID : "+orderID)
    // console.log("From Order Manage Oage : "+orderDatas);
    const productDatas = await Product.findOne({ _id: req.query.productID });
    // console.log("From Order Manage Oage : "+productDatas);
    const status = orderDatas.products.find((pro) => {
      return pro.productId == req.query.productID;
    });

    return res.render("orderManagePage", {
      odrDatas: orderDatas,
      prodDatas: productDatas,
      status,
      orderID,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//offer dashboard
const loadOfferDash = async(req,res)=>{
  try {
    const adminData = await User.findOne({ is_admin: 1 });
    const listingOffers = await Offer.find({});
    res.render("offerDash",{admin:adminData,offers:listingOffers});
  } catch (error) {
    console.log(error.message);
  }
}
//edit offers
const editOffers = async(req,res)=>{
  try {
    const offerID = req.query.id;

    const offerData =await Offer.findOne({_id:offerID})
    if(offerData != null){
      res.render('editOffer',{offer:offerData})
    }else{
      console.log("no such offer found");
    }
  } catch (error) {
    console.log(error.message);
  }
}
//update edtited offer details
const updateOfferEdit = async(req,res)=>{
  try {
    const datas = req.body
    const existingData =await Offer.findByIdAndUpdate({_id:req.body.id},
      {$set:{
        title:req.body.title,
        description:req.body.description,
        offerPercentage:req.body.offerPercentage,
        endDate:req.body.endDate,
        startDate:req.body.startDate,
        offerID:req.body.ID,
      }})
    console.log(existingData);
  } catch (error) {
    console.log(error.message);
  }
}
//generate pdf
const generatePdf = async (req, res) => {
  try {
    const interval = req.query.interval
    console.log(interval);
    const OrderProdQty = await Funcs.prodQty(Order, interval);
    console.log(OrderProdQty);
    await generatePDFReport(OrderProdQty);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );

    // Send the PDF file
    res.sendFile("sales_report.pdf", { root: "./" });
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating PDF');
  }
};




const generatePDFReport = async (sales) => {
  try {
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const htmlContent = generateHTMLContent(sales);

    await page.setContent(htmlContent);
    await page.pdf({
      path: "sales_report.pdf",
      format: "A4",
      printBackground: true,
    });

    await browser.close();
  } catch (error) {
    console.error(error.message);
  }
};

const generateHTMLContent = (sales) => {
  const tableRows = sales.map((sale) => {
    return `
      <tr>
        <td>${sale.productName}</td>
        <td>${sale.stock}</td>
        <td>${sale.totalQuantity}</td>
        <td>${sale.orderedDate.join(', ')}</td>
        <td>${sale.price}</td>
        <td>${sale.totalPrice}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <html>
      <head>
        <style>
          table {
            border-collapse: collapse;
            width: 100%;
          }

          th, td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
          }

          th {
            background-color: #f2f2f2;
          }
        </style>
      </head>
      <body>
        <h2>Sales Report</h2>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Stock To Empty</th>
              <th>Total Quantity</th>
              <th>Ordered Date</th>
              <th>Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows.join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  return htmlContent;
};



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
  orderManage,
  salesDash,
  imageEdit,
  loadEditCategory,
  updateCategory,
  loadOfferDash,
  editOffers,
  updateOfferEdit,
  generatePdf
};
