import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/document.js";
import Document from "./models/Document.js";
import auth from "./middleware/auth.js";
import User from "./models/User.js";

dotenv.config();

const app = express();


app.use(
  cors({
    origin: "http://localhost:5173", // frontend port
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());


const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


mongoose

  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("DB Connection Error:", err.message));


app.get("/", (req, res) => {
  res.send("API Running");
});

app.use("/auth", authRoutes);
app.use("/docs", documentRoutes);
app.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ message: "welcome to Dashboard", user });
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
});


io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

 
  socket.on("join-doc", (id) => {
    socket.join(id);
    console.log(` User ${socket.id} joined doc ${id}`);
  });

 
  socket.on("send-changes", ({ delta, id }) => {
    socket.to(id).emit("receive-changes", delta);
  });

  
  socket.on("save-doc", async ({ docId, content }) => {
    try {
      await Document.findByIdAndUpdate(docId, { content });
      console.log(`Doc ${docId} saved`);
    } catch (err) {
      console.error("Error saving doc:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
