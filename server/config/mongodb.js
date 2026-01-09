import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import userRoute from "./routes/userRouter.js";
import imageRoute from "./routes/imageRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

connectDB();

app.use("/api/user", userRoute);
app.use("/api/image", imageRoute);

app.get("/", (req, res) => {
  res.send("Imagify backend running 🚀");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
