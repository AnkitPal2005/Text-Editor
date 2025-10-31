import express from "express";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import crypto from "crypto";
import Document from "../models/Document.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* Utility to validate ObjectId */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* Get Document Content by ID */
router.get("/getdata/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ error: "Invalid document ID" });

    const doc = await Document.findById(id).select("content title");
    if (!doc) return res.status(404).json({ error: "Document not found" });

    res.status(200).json({
      content: doc.content,
      title: doc.title
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Get Document Content via Share Link */
router.get("/share-link/:link", async (req, res) => {
  try {
    const { link } = req.params;
    const doc = await Document.findOne({ "shareableLinks.link": link }).select(
      "_id content title shareableLinks"
    );
    if (!doc) return res.status(404).json({ error: "Document not found" });
    const meta = doc.shareableLinks.find((l) => l.link === link);
    if (!meta) return res.status(404).json({ error: "Invalid link" });
    if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) {
      return res.status(410).json({ error: "Link expired" });
    }
    res.status(200).json({
      content: doc.content,
      title: doc.title,
      role: meta.role,
      docId: doc._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Create New Document */
router.post("/create", auth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const doc = await Document.create({
      title,
      owner: req.user.id,
    });

    res.status(201).json({ message: "Document created successfully", doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* List Documents by Owner */
router.get("/list/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!isValidId(ownerId))
      return res.status(400).json({ error: "Invalid owner ID" });

    const docs = await Document.find({ owner: ownerId }).sort({
      updatedAt: -1,
    });
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Get Full Document */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id))
      return res.status(400).json({ error: "Invalid document ID" });

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Export Document as PDF */
router.get("/:id/export/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ID" });
    const doc = await Document.findById(id).select("title content");
    if (!doc) return res.status(404).json({ error: "Document not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${(doc.title || "document").replace(/[^a-z0-9\-_.]/gi, "_")}.pdf"`
    );

    const pdf = new PDFDocument({ bufferPages: true });
    pdf.pipe(res);
    pdf.fontSize(18).text(doc.title || "Untitled", { underline: true });
    pdf.moveDown();
    const plain = (doc.content || "").replace(/<[^>]+>/g, "");
    pdf.fontSize(12).text(plain, { align: "left" });
    pdf.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Export Document as PDF via Share Link */
router.get("/share-link/:link/export/pdf", async (req, res) => {
  try {
    const { link } = req.params;
    const doc = await Document.findOne({
      "shareableLinks.link": link,
    }).select("title content shareableLinks");
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const linkMeta = doc.shareableLinks.find((l) => l.link === link);
    if (!linkMeta) return res.status(404).json({ error: "Invalid link" });
    if (linkMeta.expiresAt && new Date(linkMeta.expiresAt) < new Date()) {
      return res.status(410).json({ error: "Link expired" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${(doc.title || "document").replace(/[^a-z0-9\-_.]/gi, "_")}.pdf"`
    );

    const pdf = new PDFDocument({ bufferPages: true });
    pdf.pipe(res);
    pdf.fontSize(18).text(doc.title || "Untitled", { underline: true });
    pdf.moveDown();
    const plain = (doc.content || "").replace(/<[^>]+>/g, "");
    pdf.fontSize(12).text(plain, { align: "left" });
    pdf.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Update Document Content */
router.put("/:id", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const { id } = req.params;
    let documentId = id;

    if (content === undefined) {
      return res.status(400).json({ error: "Content is required" });
    }

    // First try to find by shareable link if ID is not a valid ObjectId
    if (!isValidId(id)) {
      // This might be a shareable link
      const docByLink = await Document.findOne({
        'shareableLinks.link': id,
        'shareableLinks.role': 'Editor',
        $or: [
          { 'shareableLinks.expiresAt': null },
          { 'shareableLinks.expiresAt': { $gt: new Date() } }
        ]
      });

      if (!docByLink) {
        return res.status(400).json({ error: "Invalid document ID or shareable link" });
      }

      documentId = docByLink._id;
    }

    // Find the document by ID
    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permissions
    const isOwner = doc.owner.toString() === req.user.id;
    const sharedAccess = doc.shareWith.find(
      (s) => s.user.toString() === req.user.id && s.role === "Editor"
    );

    // Check shareable links if not owner or editor
    let hasEditorAccess = isOwner || !!sharedAccess;
    if (!hasEditorAccess && doc.shareableLinks) {
      const activeLink = doc.shareableLinks.find(
        (link) =>
          link.role === "Editor" &&
          (!link.expiresAt || new Date(link.expiresAt) > new Date())
      );
      hasEditorAccess = !!activeLink;
    }

    if (!hasEditorAccess) {
      return res.status(403).json({
        error: "You don't have permission to edit this document",
      });
    }

    // Update document content
    doc.content = content;
    doc.updatedAt = new Date();

    // Add to version history if we have a user
    if (req.user?.id) {
      doc.versions.push({
        content: content,
        user: req.user.id
      });

      // Keep only the last 20 versions
      if (doc.versions.length > 20) {
        doc.versions = doc.versions.slice(-20);
      }
    }

    await doc.save();

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      doc: {
        _id: doc._id,
        title: doc.title,
        updatedAt: doc.updatedAt
      }
    });
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({
      error: "Failed to update document",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/* Generate Shareable Link */
router.post("/share/:id", auth, async (req, res) => {
  try {
    const { role, expiresAt } = req.body;
    const { id } = req.params;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    if (doc.owner.toString() !== req.user.id)
      return res.status(403).json({ error: "Only owner can share document" });

    const link = crypto.randomBytes(6).toString("hex");
    const expiryDate = expiresAt ? new Date(expiresAt) : null;

    doc.shareableLinks.push({ link, role, expiresAt: expiryDate });
    await doc.save();

    res.status(201).json({
      message: "Shareable link created",
      link: `${process.env.FRONTEND_URL}/editor/${link}`,
      role,
      expiresAt: expiryDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Save Document Version */
router.post("/:id/saveVersion", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    doc.versions.push({
      content,
      user: req.user.id,
      createdAt: new Date(),
    });

    await doc.save();
    res.status(200).json({
      message: "Version saved successfully",
      versions: doc.versions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* List Versions (Auth) */
router.get("/:id/versions", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid ID" });
    const doc = await Document.findById(id).select("owner shareWith versions");
    if (!doc) return res.status(404).json({ error: "Document not found" });

    // allow owner or anyone shared (Viewer/Editor)
    const isOwner = doc.owner.toString() === req.user.id;
    const isShared = doc.shareWith?.some((s) => s.user.toString() === req.user.id);
    if (!isOwner && !isShared) return res.status(403).json({ error: "No access" });

    const versions = [...(doc.versions || [])]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((v) => ({ _id: v._id, createdAt: v.createdAt }));
    return res.json(versions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* List Versions via Share Link */
router.get("/share-link/:link/versions", async (req, res) => {
  try {
    const { link } = req.params;
    const doc = await Document.findOne({ "shareableLinks.link": link }).select("versions shareableLinks");
    if (!doc) return res.status(404).json({ error: "Document not found" });
    const linkMeta = doc.shareableLinks.find((l) => l.link === link);
    if (!linkMeta) return res.status(404).json({ error: "Invalid link" });
    if (linkMeta.expiresAt && new Date(linkMeta.expiresAt) < new Date()) {
      return res.status(410).json({ error: "Link expired" });
    }
    const versions = [...(doc.versions || [])]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((v) => ({ _id: v._id, createdAt: v.createdAt }));
    return res.json(versions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* Restore Document from Version */
router.post("/:id/restore/:versionId", auth, async (req, res) => {
  try {
    const { id, versionId } = req.params;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const version = doc.versions.id(versionId);
    if (!version) return res.status(404).json({ error: "Version not found" });

    // Permission check
    if (doc.owner.toString() !== req.user.id)
      return res.status(403).json({ error: "Only owner can restore document" });

    doc.content = version.content;
    doc.updatedAt = Date.now();

    await doc.save();

    res.status(200).json({ message: "Document restored", doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Delete Document */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    // Find the document first to check ownership
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check if the current user is the owner
    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the document owner can delete it" });
    }

    // Delete the document
    await Document.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({
      error: "Failed to delete document",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;
