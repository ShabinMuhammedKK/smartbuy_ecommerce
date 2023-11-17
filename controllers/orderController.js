const Order = require("../models/orderModel");
const Cart = require("../models/userCartModel");
const Address = require("../models/userAddressModel");
const Razorpay = require("razorpay");
const Transaction = require("../models/transationModel");
const Coupon = require("../models/couponModel");

// const Product = require("../models/productModel");

const instance = new Razorpay({
  key_id: "rzp_test_lrow7VIJwkZ3XE",
  key_secret: "3F5xUM9pONfpz6QA0fAAaEYP",
});

//Oerder placing
const placeOrderManage = async (req, res) => {
  try {
    // console.log(req.body);
    const userID = req.session.user_id;
    const userSelectedData = req.body;

    const selectedAddressID = userSelectedData.selectedData;
    const selectedPaymentMethod = userSelectedData.selectedPaymentOptions;

    const cartDetails = await Cart.findOne({ user_id: req.session.user_id });

    const userAddress = await Address.findOne({ user_id: req.session.user_id });

    const shipAddress = userAddress.address.find((address) => {
      return address._id == selectedAddressID;
    });

    let { country, fullName, mobileNo, pincode, city, state } = shipAddress;

    const cartProducts = cartDetails.products.map((productItem) => ({
      productId: productItem.product,
      quantity: productItem.quantity,
      OrderStatus: "placed",
      StatusLevel: 1,
    }));

    let total = await calculateTotalPrice(req.session.user_id);


    if (req.body.coupon != "") {
      const couponDetails = await Coupon.findById(req.body.coupon);
      total -= couponDetails.discount_price;
      // discountDetails.codeId = couponDetails._id;
      // discountDetails.amount = couponDetails.discount_amount;
      couponDetails.usersUsed.push(req.session.user_id);
      await couponDetails.save();
    }
    // const temp = await Cart.findOne({ user_id: req.session.user_id });

    const order = new Order({
      userId: req.session.user_id,
      "shippingAddress.country": country,
      "shippingAddress.fullName": fullName,
      "shippingAddress.mobileNumber": mobileNo,
      "shippingAddress.pincode": pincode,
      "shippingAddress.city": city,
      "shippingAddress.state": state,
      products: cartProducts,
      totalAmount: total,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: "pending",
      OrderStatus: "pending",
    });

    const placeorder = await order.save();


    // console.log("aaaaaaa : " + placeorder.paymentMethod);
    if (placeorder.paymentMethod === "COD") {
      await Order.updateOne(
        { _id: placeorder._id },
        { $set: { OrderStatus: "success" } }
      );
      const transaction = new Transaction({
        user_id: req.session.user_id,
        order_id: placeorder._id,
        paid_amount: total,
        payment_method: "COD",
        trans_id: 0,
        products:cartProducts
      });
      await transaction.save();

      await Cart.deleteOne({ user_id: userID });
      
      res.json({ success: "OrderPlaced" });
      
      
    } else if (placeorder.paymentMethod === "Online") {
      // Handle Razorpay Payment
      const orderID = placeorder._id;

      const transaction = new Transaction({
        user_id: req.session.user_id,
        order_id: placeorder._id,
        paid_amount: total,
        payment_method: "Online",
        trans_id: 0,
        products:cartProducts
      });
      await transaction.save();

      generateRazorpay(orderID, total).then((order) => {
       res.json({ success: "OnlinePayment", order });
      });
      await Cart.deleteOne({ user_id: userID });
      
    } 
    
  } catch (error) {
    console.log(error.message);
  }
};
//Razorpay function
function generateRazorpay(orderID, total) {
  return new Promise((resolve, reject) => {
    const options = {
      amount: total * 100,
      currency: "INR",
      receipt: orderID,
    };

    instance.orders.create(options, function (err, order) {
      if (err) {
        reject(err); // Handle the error by rejecting the Promise
      } else {
        resolve(order); // Resolve the Promise with the order data
      }
    });
  });
}

verifyPayment: (details) => {
  return new Promise((resolve, reject) => {
    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha256", "3F5xUM9pONfpz6QA0fAAaEYP");
    hmac.update(
      details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
    );
    hmac = hmac.digest("hex");
    if (hmac == details["payment[razorpay_signature]"]) {
      resolve();
    } else {
      reject();
    }
  });
};

//orderpage displaying
const orderUserProfile = async (req, res) => {
  try {
    
    const dynamicOrderStatus = req.query.result;


if(dynamicOrderStatus !== undefined){

const orderData = await Order.find({
  userId: req.session.user_id,
  "products.OrderStatus": dynamicOrderStatus
}).populate("products.productId");

if (!orderData || orderData.length === 0) {
  console.log(`No orders with status '${dynamicOrderStatus}' from the database`);
  // Handle the case where there are no orders that match the criteria
  return res.render("userOrders", { orderData: [] });
} else {
  return res.render("userOrders", {
    orderData,
    products: orderData.products,
  });
}
    }else{
    const orderData = await Order.find({
      userId: req.session.user_id,
    }).populate("products.productId");
    if (!orderData) {
      console.log("no orders from database");
    } else {
      return res.render("userOrders", {
        orderData,
        products: orderData.products,
      });
    }
    }


    
    
  
  } catch (error) {
    console.log(error.message);
  }
};

//===============cancel the orders by user
const cancelOrderByUser = async (req, res) => {
  const data = req.body;
  console.log(req.body);
  const productID = data.orderProdID;
  const orderID = data.OrderID;

  const cancelingProduct = await Order.findOne({ _id: orderID });
  const cancelProductID = cancelingProduct.products.find((product) => {
    return product._id == productID;
  });

  cancelProductID.OrderStatus = "Canceled";
  const success = await cancelingProduct.save();
  if (success) {
    return res.json({ result: "OK" });
  }
};

//===============cancel order by admin
const cancelOrderByAdmin = async (req, res) => {
  try {
    const productID = req.body.productID;
    const orderID = req.body.orderID;

    const cancelingProduct = await Order.findOne({ _id: orderID });
    const cancelProductID = cancelingProduct.products.find((product) => {
      return product.productId == productID;
    });

    cancelProductID.OrderStatus = "Canceled";
    const success = await cancelingProduct.save();
    if (success) {
      return res.json({ result: "OK" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//==status change by admin===
const statusChange = async (req, res) => {
  try {
    const selectedValue = req.body.selectedValue;
    const productID = req.body.productID;
    const orderID = req.body.orderID;

    const cancelingProduct = await Order.findOne({ _id: orderID });
    const cancelProductID = cancelingProduct.products.find((product) => {
      return product.productId == productID;
    });

    cancelProductID.OrderStatus = selectedValue.toString();
    const success = await cancelingProduct.save();
    if (success) {
      return res.json({ result: "OK" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//============date function===
function formatToDayMonthYear(inputDate) {
  // Create a Date object from the input date string
  const date = new Date(inputDate);

  // Define an array of month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get the day, month, and year components from the Date object
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  // Format the date in "day month year" format
  return `${day} ${monthNames[month]} ${year}`;
}

// Example usage:
// const inputDate = "2023-10-15T06:08:03.686+00:00";
// const formattedDate = formatToDayMonthYear(inputDate);
// console.log(formattedDate); // Output: "15 October 2023"

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

//verify payment

const paymentHandler = {
  changePaymentStatus: async (orderID) => {
    try {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderID },
        { $set: { OrderStatus: "Success", paymentStatus: "Paid" } },
        { new: true }
      );

      if (updatedOrder) {
        // console.log("Order updated successfully");
        return 'Payment successful';
      } else {
        console.log("Order not found or update failed");
        throw new Error("Payment failed");
      }
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  },
};

const verifyPayment = (req, res) => {
  const receipt = req.body.order["receipt"];
  const userID = req.session.user_id;

  if (!receipt) {
    console.log("Receipt not provided in the request.");
    return res.status(400).json({ status: "Payment failed" });
  }

  paymentHandler
    .changePaymentStatus(receipt)
    .then((status) => {
      Cart.deleteOne({ user_id: userID });

      return res.json({ success: "OrderPlaced" });
    })
    .catch((err) => {
      console.log(err.message || "Payment failed");
      return res.status(500).json({ status: "Payment failed" });
    });
};

module.exports = {
  placeOrderManage,
  orderUserProfile,
  cancelOrderByUser,
  cancelOrderByAdmin,
  formatToDayMonthYear,
  statusChange,
  verifyPayment,
};
