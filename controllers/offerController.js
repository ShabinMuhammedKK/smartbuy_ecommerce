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

//delete offer
const deleteOffer = async (req,res)=>{
  try {
    const id = req.query.id
    const offer = await Offer.findOneAndRemove({_id:id})
    if(offer){
      return res.json({ok:true})
    }
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  createOffer,
  loadOfferCreation,
  deleteOffer
};
