
const mongoose = require("mongoose");


const userSchema = ({
  email:{
          type:String,
          require:true
    },

    password:{
        type:String,
        require:true
    },

    verification:{
        type:String,
        Default:"NULL"
    }
})

module.exports = mongoose.model("users" , userSchema)
   