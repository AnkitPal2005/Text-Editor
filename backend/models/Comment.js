import mongoose from "mongoose";
const commentSchema=new mongoose.Schema({
    documentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Document",
        required:true
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    text:{
        type:String,
        required:true,
    },
    sectionId:{
        type:String,
        required:true,
    },
    parentCommentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment",
        default:null
    },
    resolved:{
        type:Boolean,
        default:false,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
});

commentSchema.index({ documentId: 1, sectionId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });
export default mongoose.model("Comment",commentSchema);