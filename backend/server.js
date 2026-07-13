const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Transaction = require("./models/transaction");
const User = require("./models/user");
const auth = require("./middleware/auth");

const app = express();
const JWT_SECRET = "expenseTrackerSecret";

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  try {
    const decodedPath = decodeURIComponent(req.path);
    const cleanedPath = decodedPath.trim();

    if (cleanedPath === "") {
      return res.redirect("/");
    }

    if (decodedPath !== cleanedPath) {
      req.url = cleanedPath;
    }
  } catch (err) {
    // ignore malformed path encoding
  }

  next();
});

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
};

const comparePassword = (password, storedPassword) => {
  const [salt, hash] = storedPassword.split(":");
  const derivedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return derivedHash === hash;
};

mongoose
  .connect(
    "mongodb+srv://rajnarayananabc_db_user:raj123@cluster0.b0wuhl2.mongodb.net/expenseTracker?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "..", "client", "dist", "index.html");
  res.sendFile(indexPath);
});

app.use(express.static(path.join(__dirname, "..", "client", "dist")));

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const newUser = new User({
      name,
      email,
      password: hashPassword(password),
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.use("/transaction", auth);
app.use("/summary", auth);

app.post("/transaction", async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    const savedTransaction = await transaction.save();

    res.status(201).json({
      message: "Transaction Added Successfully",
      data: savedTransaction,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.get("/transaction", async (req, res) => {
  try {
    const transactions = await Transaction.find();

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.get("/transaction/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        message: "Transaction Not Found",
      });
    }
    res.status(200).json(transaction);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.put("/transaction/:id", async (req, res) => {
  try {
    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Transaction Not Found",
      });
    }

    res.status(200).json({
      message: "Transaction Updated Successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.delete("/transaction/:id", async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Transaction Not Found",
      });
    }

    res.status(200).json({
      message: "Transaction Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

app.get("/summary", async (req, res) => {
  try {
    const transactions = await Transaction.find();

    let income = 0;
    let expense = 0;

    transactions.forEach((item) => {
      if (item.type === "Income") {
        income += item.amount;
      } else {
        expense += item.amount;
      }
    });

    res.json({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});