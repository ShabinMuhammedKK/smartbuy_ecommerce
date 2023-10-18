const Order = require("../models/orderModel");
const Cart = require("../models/userCartModel");
const Address = require("../models/userAddressModel");
const Product = require("../models/productModel");

//Oerder placing
const placeOrderManage = async (req, res) => {
  try {
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




    const order = new Order({
      userId: req.session.user_id,
      "shippingAddress.country": country,
      "shippingAddress.fullName": fullName,
      "shippingAddress.mobileNumber": mobileNo,
      "shippingAddress.pincode": pincode,
      "shippingAddress.city": city,
      "shippingAddress.state": state,
      products: cartProducts,
      totalAmount: 0,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: "pending",
      OrderStatus: "pending",
    });

    const placeorder = await order.save();

    // console.log("aaaaaaa : " + placeorder.paymentMethod);
    if (placeorder.paymentMethod === "COD") {
      await Order.updateOne(
        { _id: placeorder._id },
        { $set: { OrderStatus: "success" }
      });

      await Cart.deleteOne({ user_id: userID });

      // Respond with a success message
      res.json({ success: 'OrderPlaced' });
    } else {
      // Handle other payment methods or provide an appropriate response here
    }
  } catch (error) {
    console.log(error.message);
  }
};


//orderpage displaying
const orderUserProfile = async (req, res) => {
  try {
    const orderData = await Order.find({
      userId: req.session.user_id,
    }).populate("products.productId");

    // console.log(orderData[0].products[1].productId.price);

    if (!orderData) {
      console.log("no orders from database");
    }else{
      res.render('userOrders',{orderData,products:orderData.products});
    }
  } catch (error) {
    console.log(error.message);
  }
};
//cancel the orders
const cancelOrderByUser = async (req,res)=>{
  const odrProductID = req.boy.productID;
  const userID = req.session._id;

  console.log("userID : "+req.session._id);
  console.log("productID : "+req.boy.productID);
  const cancelingProduct = await Order.findOne({userId:req.boy.userID});
  const cancelProdunctID = cancelingProduct.products.find((product)=>{
  return product.productId===req.boy.productID;
  })

 cancelProdunctID.OrderStatus="canceled";
await cancelingProduct.save();


}


module.exports = {
  placeOrderManage,
  orderUserProfile,
  cancelOrderByUser
};
