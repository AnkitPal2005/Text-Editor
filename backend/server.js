import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Routes & Middleware Imports
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/document.js";
import commentRoutes from "./routes/comment.js";
import auth from "./middleware/auth.js";

// Models
import User from "./models/User.js";
import Document from "./models/Document.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000, // disconnect inactive clients
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("DB Connection Error:", err.message));

// Test Route
app.get("/", (req, res) => {
  res.send("API Running Successfully");
});

//  Routes
app.use("/auth", authRoutes);
app.use("/docs", documentRoutes);
app.use("/api/comments", commentRoutes);

// Protected Dashboard Route
app.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Welcome to Dashboard", user });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Socket.IO Event Handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join specific document room
  socket.on("join-doc", (docId) => {
    socket.join(docId);
    console.log(`User ${socket.id} joined doc ${docId}`);
  });

  // Real-time text updates
  socket.on("send-changes", ({ delta, docId }) => {
    socket.to(docId).emit("receive-changes", delta);
  });

  // Auto-save document content
  socket.on("save-doc", async ({ docId, content }) => {
    try {
      if (!docId || content === undefined) return;
      await Document.findByIdAndUpdate(docId, { content });
      console.log(`Doc ${docId} saved successfully`);
    } catch (err) {
      console.error("Error saving doc:", err.message);
    }
  });

  // Handle disconnects
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
