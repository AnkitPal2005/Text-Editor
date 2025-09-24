import jwt, { decode } from "jsonwebtoken";
import dotenv, { config } from "dotenv";
dotenv.config();

const auth=(req,res,next)=>{
  console.log(req.header("Authorization"));
 const token=req.header("Authorization")?.replace("Bearer ", "");
console.log(token,"dkj,fh");
 if(!token){
  return res.status(401).json({error:"Access Denied. No token provided"});
 }
 try{
  const decoded=jwt.verify(token,process.env.JWT_SECRET);
  req.user=decoded;
  next();
 }
 catch(err){
  res.status(400).json({error:"Invalid Token"});
 }
}
export default auth;