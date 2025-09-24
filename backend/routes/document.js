import express from "express";
import Document from "../models/Document.js";
import auth from "../middleware/auth.js";
const router = express.Router();
import crypto from "crypto";
import mongoose from "mongoose";
import { versions } from "process";
import { error } from "console";

// ✅ Get data by ObjectId
router.get("/getdata/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }
    const data = await Document.findById(id);
    if (!data) return res.status(404).json({ message: "Document not found" });

    res.status(200).json({ content: data.content });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching document", error: err.message });
  }
});

// ✅ Create new document
router.post("/create", auth, async (req, res) => {
  try {
    const { title } = req.body;
    const owner = req.user.id;
    const doc = new Document({ title, owner });
    await doc.save();
    res.json({ message: "Document Created", doc });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating document", error: err.message });
  }
});

// ✅ List documents by owner
router.get("/list/:ownerId", async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.params.ownerId });
    res.json(docs);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching documents", error: err.message });
  }
});

// ✅ Get document by ID
router.get("/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    res.json(doc);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error Fetching Document", error: err.message });
  }
});

// ✅ Update document content (IMPORTANT FIX)
router.put("/:id", async (req, res) => {
  try {
    const { content } = req.body;
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { content, updatedAt: Date.now() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json({ message: "Document updated", doc });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating document", error: err.message });
  }
});

// ✅ Create shareable link
router.post("/share/:id", auth, async (req, res) => {
  try {
    const { role, expiresAt } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (doc.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only owner can share this document" });
    }

    const link = crypto.randomBytes(6).toString("hex");
    doc.shareableLinks.push({
      link,
      role,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    await doc.save();

    res.json({
      message: "Shareable link created",
      link: `${process.env.FRONTEND_URL}/editor/${link}`,
      role,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error Creating Shareable Link", error: err.message });
  }
});

// ✅ Access document via share link
router.get("/share-link/:link", async (req, res) => {
  try {
    const { link } = req.params;
    const doc = await Document.findOne({ "shareableLinks.link": link });
    if (!doc) return res.status(404).json({ message: "Invalid link" });

    const linkData = doc.shareableLinks.find((l) => l.link === link);

    res.json({
      docId: doc._id,
      title: doc.title,
      content: doc.content,
      role: linkData.role,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching document", error: err.message });
  }
});

//Version History Api

router.post("/:id/saveVersion",auth,async(req,res)=>{
  try{
    const{id}=req.params;
    const{content}=req.body;
    const doc=await Document.findById(id);
    if(!doc) return res.status(404).json({message:"Document not Found"});
    doc.versions.push({
      content,
      user:req.user.id,
    });
    await doc.save();
    res.json({message:"Version Saved Successfully",versions:doc.versions});
  }
  catch(err){
    res.status(500).json({message:"Error saving version",error:err.message});
  }
});
//get All version
router.get("/:id/versions",auth,async(req,res)=>{
  try{
    const{id}=req.params;
    const doc=await Document.findById(id).populate("versions.user","name email");
    if(!doc) return res.status(404).json({message:"Document Not Found"});
    res.json(doc.versions);
  }
  catch(err){
    res.status(500).json({message:"Error Fetching Versions",error:err.message});
  }
});

//restore a version

router.post("/:id/restore/:versionId",auth,async(req,res)=>{
  try{
    const{id,versionId}=req.params;
    const doc=await Document.findById(id);
    if(!doc) return res.status(404).json({message:"version not found"});
    const version=doc.versions.id(versionId);
    if(!version) return res.status(404).json({message:"version not found"});
    doc.content=version.content
    doc.updatedAt=Date.now();
    await doc.save();
    res.json({message:"Document restored to selected Versions",doc});
  }
  catch(err){
    return res.status(500).json({message:"Error Restoring Version",error:err.message});
  }
});

export default router;
