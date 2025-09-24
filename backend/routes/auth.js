import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const router=express.Router();
//signUp
router.post("/signup",async(req,res)=>{
    try{
        const{name,email,password}=req.body;
        if(!email&&!name&&!password)
             return res.status(400).json({ error: "Please enter all fields" });
        const hashPassword=await bcrypt.hash(password,10);
        const user=new User({name,email,password:hashPassword});
        await user.save();
        res.json({message:"User Created"});
    }
    catch(err){
        console.log("Server error",err);
    }
});
//Login
router.post("/login",async(req,res)=>{
    try{
        const{email,password}=req.body;
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({error:"Invalid Credentials"});
        }
        const ismatch=await bcrypt.compare(password,user.password);
        if(!ismatch){
            return res.status(400).json({error:"Invalid credentials"});
        }

        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{
            expiresIn:"1h",
        });

        res.json({ message: "Login Successful", token,user:{id:user._id,name:user.name,email:user.email},});
    }
    catch(err){
        console.log("server error",err);
    }
});
export default router