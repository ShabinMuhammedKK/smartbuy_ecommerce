//COMMON FUNCTIONS

const totalOrderedProductCount = async (Order) => {
  try {
    const result = await Order.aggregate([
      {
        $unwind: "$products", // Split the array into separate documents
      },
      {
        $group: {
          _id: null,
          totalArrayCount: { $sum: 1 }, // Count the number of documents (which equals the total count of the array elements)
        },
      },
    ]).exec();

    if (result.length > 0) {
      const totalArrayCount = result[0].totalArrayCount;
      return totalArrayCount;
    } else {
      return 0; // No data or no arrays found
    }
  } catch (error) {
    console.log(error.message);
  }
};
//STOCK DETAILS
const productStock = async (Product) => {
  try {
    const result = await Product.aggregate([
      {
        $group: {
          _id: "$name",
          stock: { $sum: "$stock" },
        },
      },
    ]).exec();

    if (result) {
      //     for (let i = 0; i < result.length; i++) {
      //         const doc = result[i];
      //         console.log( doc._id + "--" + doc.stock);
      //       }

      //   } else {
      //     console.log("No data found");
      //   }
      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error.message);
    return null;
  }
};
//TRANSACTIONS
const transacHistory = async (Transaction) => {
  try {
    const transactions = await Transaction.aggregate([
      {
        $group: {
          _id: "$payment_method",
          amount: { $sum: "$paid_amount" },
          date: {
            $push: {
              $dateToString: {
                format: "%d-%b-%Y",
                date: "$date",
                timezone: "Asia/Kolkata",
              },
            },
          },
        },
      },
    ]).exec();

    if (transactions) {
      // for(let i=0;i<transactions.length;i++){
      //   console.log(transactions[i]._id+"=="+transactions[i].amount+"=="+transactions[i].date)
      // }
      return transactions;
    }
  } catch (error) {
    console.log(error.message);
  }
};
//ORDERS LISTING
const orderListing = async (Order) => {
  try {
    const ordersWithProducts = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products", // Use the name of the "products" collection
          localField: "products.productId", // Assuming products have a "productId" field
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $unwind: "$productData",
      },
      {
        $project: {
          _id: 1,
          OrderStatus: 1,
          product: "$productData",
          paymentMethod: "$paymentMethod",
          paymentStatus: "$paymentStatus",
          date: {
            $dateToString: {
              format: "%d-%b-%Y",
              date: "$orderDate",
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
    ]).exec();

    if (ordersWithProducts) {
      // console.log(ordersWithProducts);
      return ordersWithProducts;
    }
  } catch (error) {
    console.log(error.message);
  }
};
//REVENUE
const calculateTotalRevenue = async (Order) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $multiply: ["$totalAmount", 0.3] } },
        },
      },
    ]).exec();

    if (orders.length > 0) {
      const totalRevenue = orders[0].totalAmount;
      // console.log("Total Revenue:", totalRevenue);
      return totalRevenue;
    } else {
      console.log("There is no data in the orders");
      return 0; // or any other default value
    }
  } catch (error) {
    console.error(error.message);
    return 0; // Handle the error and return a default value
  }
};
//EACH PRODUCT QTY
const prodQty = async (Order) => {
  try {
    const result = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.productId": "651f2060c1a28f5885d5f95",
        },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
    ]);

    if (result.length > 0) {
      return result[0].totalQuantity;
    }

    return 0;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  totalOrderedProductCount,
  productStock,
  transacHistory,
  orderListing,
  calculateTotalRevenue,
  prodQty,
};
