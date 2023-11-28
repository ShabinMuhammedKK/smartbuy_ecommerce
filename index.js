
const mongoose = require("mongoose");
const userRoute = require("./routes/userRoute")
const adminRoute = require("./routes/adminRoute");
const nocache = require('nocache');
const path = require('path')
const express = require("express");
const app = express();
const port = 3000;

mongoose.connect("mongodb+srv://shabinmkk:D6foC5kco1pTcTGX@smartbuycluster.6onoeep.mongodb.net/smartbuy",{ useNewUrlParser: true, useUnifiedTopology: true });
app.use(nocache());
app.use(express.static(path.join(__dirname, "public")));



app.use('/',userRoute)
app.use('/admin',adminRoute)



app.listen(port,()=>{
    console.log(`server is running on http://localhost:${port}/`);
})