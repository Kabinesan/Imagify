import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import crypto from "crypto";
import transactionModel from "../models/transactionModel.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.create({ name, email, password: hashedPassword });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ success: true, token, user: { name: user.name } });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) return res.json({ success: false });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.json({ success: false });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ success: true, token, user: { name: user.name } });
};

export const userCredits = async (req, res) => {
  const user = await userModel.findById(req.userId);
  res.json({ success: true, credits: user.creditBalance, user: { name: user.name } });
};

export const payRazor = async (req, res) => {
  const { planId } = req.body;

  const plans = {
    Basic: { price: 10, credits: 100 },
    Advanced: { price: 50, credits: 500 },
    Business: { price: 250, credits: 5000 },
  };

  if (!plans[planId]) return res.json({ success: false });

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await razorpay.orders.create({
    amount: plans[planId].price * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  });

  await transactionModel.create({
    userId: req.userId,
    razorpayOrderId: order.id,
    amount: plans[planId].price,
    creditsAdded: plans[planId].credits,
  });

  res.json({ success: true, order });
};

export const verifyRazor = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature) return res.json({ success: false });

  const transaction = await transactionModel.findOne({ razorpayOrderId: razorpay_order_id });
  transaction.razorpayPaymentId = razorpay_payment_id;
  transaction.status = "completed";
  await transaction.save();

  const user = await userModel.findById(req.userId);
  user.creditBalance += transaction.creditsAdded;
  await user.save();

  res.json({ success: true });
};