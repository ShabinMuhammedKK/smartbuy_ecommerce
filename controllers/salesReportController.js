const Order = require("../models/orderModel");
const Funcs = require("../public/assets/comfuncs.js/funcs");
const Transaction = require('../models/transationModel');


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
    const ChartDatas = await Funcs.chartCount(Transaction); 
    // console.log(ChartDatas);
    if(TotalRevenue && TotalOdrProd && ChartDatas){
     return res.json({TotalRevenue,TotalOdrProd,ChartDatas});
    }else{
      return console.log(`datas not found from "dashboardDisplayData"`);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const salesReportDisplayData = async (req,res)=>{
  try {
    const TopSoldProduct = await Funcs.topProducts(Order);
    const DateWiseDatas = await Funcs.salesDateWise(Order);
    // console.log(DateWiseDatas);

    if(TopSoldProduct && DateWiseDatas){
      return res.json({TopSoldProduct,DateWiseDatas});
    }else{
      console.log("TopSoldProduct content not founded");
    }
  } catch (error) {
    console.log(error.message);
  }
}





module.exports = {
  dashboardDisplayData,
  salesReportDisplayData,
};
