//COMMON FUNCTIONS
const Order = require("../../../models/orderModel");

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
        $project: {
          payment_method: 1,
          paid_amount: 1,
          date: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$date",
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
    ]).exec();
    

    if (transactions) {
      
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
          from: "products",
          localField: "products.productId",
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
              format: "%d-%m-%Y",
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
          totalAmount: { $sum: "$totalAmount" },
          totalProfit: { $sum: { $multiply: ["$totalAmount", 0.3] } },
        },
      },
    ]).exec();

    if (orders.length > 0) {
      const totalRevenue = [orders[0].totalAmount, orders[0].totalProfit];
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
const prodQty = async (Order, interval) => {
  try {
    const filteredData = await getFilteredData(Order, interval);
    return filteredData;
  } catch (error) {
    console.log(error.message);
  }
};
//COUNT OF PAYMENTS TO CHART
const chartCount = async (Transaction) => {
  try {
    const countOfBoth = Transaction.aggregate([
      {
        $group: {
          _id: null, // Group all documents together
          cashOnDeliveryCount: {
            $sum: {
              $cond: [{ $eq: ["$payment_method", "COD"] }, 1, 0],
            },
          },
          onlineCount: {
            $sum: {
              $cond: [{ $eq: ["$payment_method", "Online"] }, 1, 0],
            },
          },
        },
      },
    ]).exec();
    return countOfBoth;
  } catch (error) {
    console.log(error.message);
  }
};
//TOP SELLING PRODUCT FOR SALES REPORT PAGE
const topProducts = async (Order) => {
  try {
    const result = await Order.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $group: {
          _id: "$products.productId",
          productName: { $first: "$productInfo.name" },
          soldCount: { $sum: "$products.quantity" },
        },
      },
      { $sort: { soldCount: -1 } },
      { $limit: 6 },
    ]);
    // console.log(result);
    return result;
  } catch (error) {
    console.log(error.message);
  }
};
//SALES DATE WISE DISPLAY
const salesDateWise = async (Order) => {
  try {
    const result = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$_id",
          date: {
            $first: {
              $dateToString: {
                format: "%d %m %Y",
                date: "$orderDate",
              },
            },
          },
          totalQuantity: { $sum: "$products.quantity" },
        },
      },

      { $sort: { date: 1 } },
      { $limit: 7 },
    ]).exec();
    if (result) {
      return result;
    } else {
      console.log("salesDateWise data not found");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//FILTER PRODUCTS
const getFilteredData = async (Order, interval) => {
  try {
    let filterCriteria = {};

    switch (interval) {
      case "daily":
        // Construct filterCriteria for daily filtering
        const currentDateDaily = new Date();
        const yesterdayDaily = new Date(currentDateDaily);
        yesterdayDaily.setDate(yesterdayDaily.getDate() - 1);
        filterCriteria = {
          orderDate: {
            $lte: currentDateDaily,
            $gte: yesterdayDaily,
          },
        };
        break;

      case "weekly":
        // Construct filterCriteria for weekly filtering
        const currentWeekStart = new Date();
        currentWeekStart.setHours(0, 0, 0, 0);
        currentWeekStart.setDate(
          currentWeekStart.getDate() - currentWeekStart.getDay()
        );
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() - 6);

        filterCriteria = {
          orderDate: {
            // $lte: currentWeekStart,
            $gte: currentWeekEnd,
          },
        };
        break;

      case "monthly":
        // Construct filterCriteria for monthly filtering
        const currentDateMonthly = new Date();
        const lastMonthMonthly = new Date(currentDateMonthly);
        lastMonthMonthly.setMonth(lastMonthMonthly.getMonth() - 1);

        filterCriteria = {
          orderDate: {
            // $gte: lastMonthMonthly,
            $lte: currentDateMonthly,
          },
        };
        break;

      default:
        // Invalid interval
        return { error: "Invalid interval" };
    }

    
    const result = await Order.aggregate([
      
      {
        $unwind: "$products",
      },
      {
        $match: filterCriteria,
      },

      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $group: {
          _id: "$products.productId",
          productName: { $first: "$productInfo.name" },
          stock: { $first: "$productInfo.stock" },
          totalQuantity: { $sum: "$products.quantity" },
          orderedDate: {
            $push: {
              $dateToString: { format: "%d-%m-%Y", date: "$orderDate" },
            },
          },
          image: { $first: "$productInfo.image" },
          price: { $first: "$productInfo.price" },
          totalPrice: {
            $sum: {
              $multiply: [
                "$products.quantity",
                { $sum: { $multiply: ["$productInfo.price", 0.3] } },
              ],
            },
          },
        },
      },
    ]).exec();

    // console.log(result);
    // console.log("Selected Interval:", interval);
    // console.log("Filter Criteria:", filterCriteria);
    return result;
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  totalOrderedProductCount,
  productStock,
  transacHistory,
  orderListing,
  calculateTotalRevenue,
  prodQty,
  chartCount,
  topProducts,
  salesDateWise,
  getFilteredData,
  
};
