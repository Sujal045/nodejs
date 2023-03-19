const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "backend",
  })
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const isAuth = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "hjdhfhdkkshs");
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};

app.use(express.static(path.join(path.resolve(), "public")));
app.use(cookieParser());

app.get("/", isAuth, (req, res) => {
  res.render("logout", { name: req.user.name });
  console.log(req.user);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });

  if (!user) return res.redirect("/register");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch)
    return res.render("login", { email, message: "Wrong Credenetials" });

  const token = jwt.sign({ _id: user._id }, "hjdhfhdkkshs");

  res.cookie("token", token, {
    httpOnly: true,
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return res.redirect("/login");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  user = await User.create({
    name,
    email,
    password: hashPassword,
  });

  const token = jwt.sign({ _id: user._id }, "hjdhfhdkkshs");

  res.cookie("token", token, {
    httpOnly: true,
  });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
