
const userModel = require("../schema/userScehma");
const userRoute = require("express").Router();
const { hashPassword, generateLink, verifyToken } = require("./userAuthosrisation");
const nodemailer = require('nodemailer')

userRoute.get("/", async (req, res) => {
    const users = await userModel.find();
    res.status(200).json({ message: "all user", users })
})


// register user ( email + password)
userRoute.post("/register", async (req, res) => {

    try {
        const user = await userModel.findOne({ email: req.body.email })


        if (!user) {

            const hashedPassword = await hashPassword(req.body.password)

            userModel.create({ email: req.body.email, password: hashedPassword })
                .then(resolve => res.status(200).json({ message: "Registration successful" }))
                .catch((error) => {
                    res.status(400).json({ message: "Invalid Email", error: "error" })
                });

        } else {
            res.send({ message: "User already exists" })
        }

    } catch (error) {
        res.send({ message: "Registration failed", error })
    }
})


// verify user and send reset password link
userRoute.post("/forgot_password", async (req, res) => {

    const email = req.body.email;

    // check the availability of user's email from database.if not
    try {
        const user = await userModel.findOne({ email: req.body.email });
        
        
        if (user === "null") {
            return res.status(401).json({ message: "USER NOT EXIST" })
        }

        // if user exists
        const link = await generateLink(user.email)
        await userModel.findOneAndUpdate({ email: user.email }, { verification: link.verification })

        const reset_link = `${process.env.LINK}/${link.verification}/${link.token}`

        // sending mail to reset password
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.USER,
                pass: process.env.PASS
            }
        })
        const mailOption = {
            from: process.env.USER,
            to: process.env.RECEIVING_MAIL_ID, 
            subject: 'PASSWORD RESET REQUEST',
            text: ` Hi , User \n Forgot Your Password? \n We received a reset password request from your account \n\n
                    Here is the link to reset password ${reset_link} \n Link expires in 5 minutes `
        }

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                return res.status(404).json({ message: 'something went wrong.' })
            } else {
                res.status(200).json({ message: 'mail sent successfully', info })
            }
        })
        transporter.close()

        res.status(200).json({ message: "Password reset link has sent to your email", reset_link })

    } catch (error) {
        return res.status(401).json({ message: "Invalid email ❌ " })
    }

})



// check verification code
userRoute.post("/verify_code" , async(req,res)=>{
    const verificationCode = req.body.verificationCode;
    const verify = await userModel.findOne({verification:verificationCode})
    const code = verify?.verification;
    if(verificationCode !== code){
        return  res.status(401).json({message:"VERIFICATION CODE MISMATCH"})

    }
     res.status(200).json({message:"VERIFICATION CODE MATCHED"})

} )




// reset  password
userRoute.patch("/reset_password/:verification/:token", async (req, res) => {
    const { verification, token } = req.params;
    const newPassword = await hashPassword(req.body.password)

    try {
        verifyToken(token);
        const user = await userModel.findOne({ verification: verification })
        const verificationCode = user?.verification;
        if (verificationCode !== verification) {
            return res.status(400).json({message:"YOU HAVE ALREADY USED THIS LINK TO RESET PASSWORD"})
        }
        await userModel.findOneAndUpdate({ verification: verification }, { verification: "NULL", password: newPassword }, { new: true })
        res.status(200).json({ message: "PASSWORD CHANGED SUCCESFULLY" })
    } catch (error) {
        res.status(401).json({message:"LINK EXPIRED" , error})
    }
})



module.exports = userRoute;