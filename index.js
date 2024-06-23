import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// Database Connection With MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Image Storage Engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

app.post("/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`
  });
});

// Route for Images folder
app.use('/images', express.static('upload/images'));

// Middleware to fetch user from token
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const { user } = jwt.verify(token, "secret_ecom");
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

// Schema for creating user model
const Users = mongoose.model("Users", {
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: Object,
  date: { type: Date, default: Date.now }
});

// Schema for creating Product
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: Number,
  old_price: Number,
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true }
});

// ROOT API Route For Testing
app.get("/", (req, res) => {
  res.send("Root");
});

// Login endpoint
app.post('/login', async (req, res) => {
  console.log("Login");
  let success = false;
  const user = await Users.findOne({ email: req.body.email });
  if (user && req.body.password === user.password) {
    const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');
    success = true;
    console.log(user.id);
    res.json({ success, token });
  } else {
    res.status(400).json({ success, errors: "Please try with correct email/password" });
  }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  console.log("Sign Up");
  let success = false;
  const check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success, errors: "Existing user found with this email" });
  }
  const cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });
  await user.save();
  const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');
  success = true;
  res.json({ success, token });
});

// Endpoint for getting all products data
app.get("/allproducts", async (req, res) => {
  const products = await Product.find({});
  console.log("All Products");
  res.send(products);
});

// Endpoint for getting latest products data
app.get("/newcollections", async (req, res) => {
  const products = await Product.find({});
  const arr = products.slice(0).slice(-8);
  console.log("New Collections");
  res.send(arr);
});

// Endpoint for getting products by category
app.get("/cpu", async (req, res) => {
  const products = await Product.find({ category: "cpu" });
  const arr = products.slice(0, 4);
  console.log("Popular In Women");
  res.send(arr);
});

// Endpoint for getting related products by category
app.post("/relatedproducts", async (req, res) => {
  console.log("Related Products");
  const { category } = req.body;
  const products = await Product.find({ category });
  const arr = products.slice(0, 4);
  res.send(arr);
});

// Endpoint for adding product to cart
app.post('/addtocart', fetchuser, async (req, res) => {
  console.log("Add Cart");
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

// Endpoint for removing product from cart
app.post('/removefromcart', fetchuser, async (req, res) => {
  console.log("Remove Cart");
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] !== 0) {
    userData.cartData[req.body.itemId] -= 1;
  }
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Removed");
});

// Endpoint for getting user's cart data
app.post('/getcart', fetchuser, async (req, res) => {
  console.log("Get Cart");
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

// Endpoint for adding products using admin panel
app.post("/addproduct", async (req, res) => {
  const products = await Product.find({});
  let id = products.length > 0 ? products.slice(-1)[0].id + 1 : 1;
  const product = new Product({
    id,
    name: req.body.name,
    description: req.body.description,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  await product.save();
  console.log("Saved");
  res.json({ success: true, name: req.body.name });
});

// Endpoint for removing products using admin panel
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({ success: true, name: req.body.name });
});

// Starting Express Server
app.listen(port, () => {
  console.log(`Server Running on port ${port}`);
});
