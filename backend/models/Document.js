import mongoose from "mongoose";

const versionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, default: "" },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shareWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["Viewer", "Editor"], default: "Viewer" },
      },
    ],
    shareableLinks: [
      {
        link: { type: String, required: true },
        role: { type: String, enum: ["Viewer", "Editor"], default: "Viewer" },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
      },
    ],
    versions: [versionSchema],
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, updatedAt: -1 });
documentSchema.index({ "shareableLinks.link": 1 });

const Document = mongoose.model("Document", documentSchema);
export default Document;
