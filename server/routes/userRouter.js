import express from "express";
import {
  registerUser,
  loginUser,
  userCredits,
  payRazor,
  verifyRazor,
} from "../controllers/userController.js";
import userAuth from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/credits", userAuth, userCredits);
router.post("/pay", userAuth, payRazor);
router.post("/verify", userAuth, verifyRazor);

export default router;