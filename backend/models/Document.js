import mongoose from "mongoose";
import User from "../models/User.js";

const versionSchema=new mongoose.Schema({
    content:{type:String,required:true},
    createdAt:{type:Date,default:Date.now},
    user:{type:mongoose.Schema.Types.ObjectId,ref:"User"}
})

const documentSchema=new mongoose.Schema({
    title:{type:String,required:true},
    content:{type:String,default:""},
    owner:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now},

    shareWith:[
        {
        user:{type:mongoose.Schema.Types.ObjectId,ref:User},
        role:{type:String,enum:["Viewer","Editor"],default:"Viewer"}
        }
    ],
    shareableLinks:[
        {
            link:{type:String,required:true},
            role:{type:String,enum:["Viewer","Editor"],default:"Viewer"},
            createdAt:{type:Date,default:Date.now},
            expiresAt:{type:Date}
        }
    ],
    versions:[versionSchema]
});
const Document=mongoose.model("Document",documentSchema);
export default Document;