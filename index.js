const express = require("express");
const cors = require("cors");
require("./database/database")
require('dotenv').config();

const userRoute = require("./route/user");

const app = express();

app.use(express.json())
app.use(cors())
app.use('/user',userRoute);


// listen port
app.listen(process.env.PORT , () => console.log("😊 server online"  ))



app.get("/" , (req,res) =>{
    res.status(200).json({message:"Password reset task"})
})

