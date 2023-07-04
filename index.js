
import express from 'express';
import path from "path";
import mongoose from 'mongoose';
const { Schema } = mongoose;
import cookieParser from 'cookie-parser';
import jsonWebToken from "jsonwebtoken";
import bcrypt from "bcrypt";
// it will reqturn the promise
mongoose.connect("mongodb://localhost:27017",{
    dbName:"Backend",
}).then(()=>{
    console.log("Database connected");
}).catch((e)=>{
    console.log(`Database is not connected ${e}`);
})
;
const usershema=new Schema({
    name: String,
    email: String,
    password:String,
});

const User=mongoose.model("User",usershema);
const app=express();
// setting a view engine

// middleware --
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(path.resolve(),"public")));
app.use(cookieParser());

// setting view engine
app.set("view engine","ejs");

const isAuthenticated=async(req,res,next)=>{
const { token }=req.cookies;
if(token){
    try{
    const decoded=jsonWebToken.verify(token,"bhbhbjnb")
    req.user=await User.findById(decoded._id);
    if(req.user){
    next();
}
else{
    throw new Error("User not found");
}
    }
    catch(error){
        console.log(error);
        res.redirect("/login");
    }
}
else{
    res.redirect("/login");
}
};
app.get("/",isAuthenticated,(req,res)=>{
  //  console.log(req.User);
  res.render("logout",{name:req.user.name});
})

app.get("/login",(req,res)=>{
    res.render("login");
})



app.get("/register",(req,res)=>{
    res.render("register");
});


app.post("/login",async (req,res)=>{
    const{email,password}=req.body;
    try{
    const user=await User.findOne({email})

    if(!user){
       return res.redirect("/register");
    }
    const ismatch=bcrypt.compare(password, user.password);
    if(!ismatch) return res.render("login",{email,message:"Incorrect password"});
    const token=jsonWebToken.sign({_id:user._id},"bhbhbjnb");
    res.cookie("token",token,
    {
        httpOnly:true,
        expires:new Date(Date.now()+60*1000),
    }
    );
    res.redirect("/");
}
catch(error){
    console.log(error);
    res.redirect("/login");
}
});


app.post("/register",async(req,res)=>{
    const{name,email,password}=req.body;
    try{
    const user=await User.findOne({email})
    if(user){
       return res.redirect("/login");
    }
    const hashedpassword=await bcrypt.hash(password,10);
     await User.create({
        name,email,password:hashedpassword,
    });
    
    const token=jsonWebToken.sign({_id:user._id},"bhbhbjnb");
    res.cookie("token",token,
    {
        httpOnly:true,
        expires:new Date(Date.now()+60*1000),
    }
    );
    res.redirect("/");
}
catch(error){
    console.log(error);
    res.redirect("/register");
}
})

app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now()),
    });
    res.redirect("/");
});

app.listen(5000,()=>{
    console.log('server is running at 5000');
})