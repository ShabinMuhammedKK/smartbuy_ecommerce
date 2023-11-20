const Offer = require("../models/offerModel");

//load offer creation
const loadOfferCreation = async(req,res)=>{
    try {
       return  res.render('addOffer');
    } catch (error) {
        console.log(error.message);
    }
}


//offer creation
const createOffer = async (req,res) => {
  try {
    
    const offerData = new Offer({
        title:req.body.title,
        description:req.body.description,
        offerPercentage:req.body.offerPercentage,
        startDate:req.body.startDate,
        endDate:req.body.endDate,
        offerID:req.body.ID,
    })

    const savedData = await offerData.save();
    console.log("offer saved");
    
  } catch (error) {
    console.error(error.message);
    throw error; // Rethrow the error to be caught by the calling function
  }
};



module.exports = {
  createOffer,
  loadOfferCreation
};
