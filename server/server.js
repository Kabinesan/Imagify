import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";

import userRoute from "./routes/userRouter.js";
import imageRoute from "./routes/imageRoutes.js";

dotenv.config();

const app = express(); // ✅ THIS WAS MISSING

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Connect DB
connectDB();

// Routes
app.use("/api/user", userRoute);
app.use("/api/image", imageRoute);

// Root test route (optional but useful)
app.get("/", (req, res) => {
  res.send("Imagify backend running 🚀");
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
