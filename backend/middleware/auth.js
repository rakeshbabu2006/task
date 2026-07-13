const jwt = require("jsonwebtoken");
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        message: "Access Denied. No Token Provided.",
      });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Invalid Token",
      });
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET || "expenseTrackerSecret");
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

module.exports = auth;