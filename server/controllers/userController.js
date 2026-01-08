import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.json({ success: false, message: "Missing details" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token, user: { name: user.name } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token, user: { name: user.name } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET USER CREDITS
export const userCredits = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user)
      return res.json({ success: false, message: "User not found" });

    res.json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// RAZORPAY ORDER (will work only after keys enabled)
export const payRazor = async (req, res) => {
  try {
    const { planId } = req.body;

    const plans = {
      Basic: { price: 10, credits: 100 },
      Advanced: { price: 50, credits: 500 },
      Business: { price: 250, credits: 5000 },
    };

    if (!plans[planId])
      return res.json({ success: false, message: "Invalid plan" });

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: plans[planId].price * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    await transactionModel.create({
      userId: req.userId,
      razorpayOrderId: order.id,
      amount: plans[planId].price,
      creditsAdded: plans[planId].credits,
    });

    res.json({ success: true, order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// VERIFY PAYMENT
export const verifyRazor = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id } = req.body;

    const transaction = await transactionModel.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!transaction)
      return res.json({ success: false, message: "Transaction not found" });

    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.status = "completed";
    await transaction.save();

    const user = await userModel.findById(req.userId);
    if (user) {
      user.creditBalance += transaction.creditsAdded;
      await user.save();
    }

    res.json({ success: true, message: "Credits added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
