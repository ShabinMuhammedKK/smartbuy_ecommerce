const Order = require("../models/orderModel");
const Funcs = require("../public/assets/comfuncs.js/funcs");


/*_____________________________________________________
      INCLUDES
 Revenue - prod prof * quantity                    
 Total sales - count of the product sold           
 Total stock of each products                      
 Transaction history - listing                     
 Recent orders - orders listing as user orders page
-----------------------------------------------------*/

const dashboardDisplayData = async (req, res) => {
  try {
    const TotalRevenue = await Funcs.calculateTotalRevenue(Order); //sum
    const TotalOdrProd = await Funcs.totalOrderedProductCount(Order); //count
    if(TotalRevenue && TotalOdrProd){
     return res.json({TotalRevenue,TotalOdrProd});
    }else{
      return console.log(`datas not found from "dashboardDisplayData"`);
    }
  } catch (error) {
    console.log(error.message);
  }
};



module.exports = {
  dashboardDisplayData,
};
