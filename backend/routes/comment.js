import express from "express";
import Comment from "../models/Comment.js";
const router = express.Router();

// Create comment
router.post("/", async (req, res) => {
  try {
    const comment = new Comment(req.body);
    await comment.save();
    await comment.populate("author", "name email");
    return res.status(201).json(comment);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Get comments for a document section
router.get("/:docId/:sectionId", async (req, res) => {
  try {
    const { docId, sectionId } = req.params;
    // assume Comment schema uses fields `documentId` and `sectionId`
    const comments = await Comment.find({ documentId: docId, sectionId }).populate("author", "name email");
    return res.json(comments);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Reply to a comment (creates a new comment with parentCommentId)
router.post("/reply/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const reply = new Comment({
      ...req.body,
      parentCommentId: commentId,
    });
    await reply.save();
    await reply.populate("author", "name email");
    return res.status(201).json(reply);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Delete comment (resolve = delete)
router.patch("/resolve/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const deleted = await Comment.findByIdAndDelete(commentId);
    if (!deleted) return res.status(404).json({ error: "Comment not found" });
    return res.json({ message: "Comment deleted", _id: commentId });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
