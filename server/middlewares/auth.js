import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token)
      return res.status(401).json({ success: false, message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "JWT verification failed" });
  }
};

export default userAuth;
