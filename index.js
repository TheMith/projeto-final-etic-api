import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import multer from "multer";
import cors from "cors";
import Grid from "gridfs-stream";
import { GridFsStorage } from "multer-gridfs-storage";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// Database Connection With MongoDB
const mongoURI = process.env.MONGODB_URI;
const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gfs;
conn.once("open", () => {
  // Initialize GridFS stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`,
      bucketName: "uploads", // Bucket name should match GridFS collection
    };
  },
});
const upload = multer({ storage });

// Endpoint for image upload
app.post("/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `/image/${req.file.filename}`,
  });
});

// Route for getting an image by filename
app.get("/image/:filename", async (req, res) => {
  const file = await gfs.files.findOne({ filename: req.params.filename });
  if (!file) {
    return res.status(404).json({ success: 0, message: "File not found" });
  }

  // Check if the file is an image
  if (file.contentType.startsWith("image/")) {
    const readStream = gfs.createReadStream(file.filename);
    readStream.pipe(res);
  } else {
    res.status(404).json({ success: 0, message: "Not an image" });
  }
});

// Middleware to fetch user from token
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

// Schema for creating user model
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  date: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Schema for creating Product
const productSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number },
  old_price: { type: Number },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

const Product = mongoose.model("Product", productSchema);

// ROOT API Route For Testing
app.get("/", (req, res) => {
  res.send("Root");
});

// Endpoint for login
app.post('/login', async (req, res) => {
  let success = false;
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id,
        },
      };
      success = true;
      const token = jwt.sign(data, 'secret_ecom');
      res.json({ success, token });
    } else {
      return res.status(400).json({ success, errors: "Please try with correct email/password" });
    }
  } else {
    return res.status(400).json({ success, errors: "Please try with correct email/password" });
  }
});

// Endpoint for registration
app.post('/signup', async (req, res) => {
  let success = false;
  const check = await User.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success, errors: "Existing user found with this email" });
  }
  const cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new User({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });
  await user.save();
  const data = {
    user: {
      id: user.id,
    },
  };
  const token = jwt.sign(data, 'secret_ecom');
  success = true;
  res.json({ success, token });
});

// Endpoint for getting all products data
app.get("/allproducts", async (req, res) => {
  const products = await Product.find({});
  res.send(products);
});

// Endpoint for getting latest products data
app.get("/newcollections", async (req, res) => {
  const products = await Product.find({});
  const arr = products.slice(-8);
  res.send(arr);
});

// Endpoint for getting products by category
app.get("/cpu", async (req, res) => {
  const products = await Product.find({ category: "cpu" });
  const arr = products.slice(0, 4);
  res.send(arr);
});

// Endpoint for getting related products
app.post("/relatedproducts", async (req, res) => {
  const { category } = req.body;
  const products = await Product.find({ category });
  const arr = products.slice(0, 4);
  res.send(arr);
});

// Endpoint for saving the product in cart
app.post('/addtocart', fetchuser, async (req, res) => {
  const userData = await User.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await User.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

// Endpoint for removing the product in cart
app.post('/removefromcart', fetchuser, async (req, res) => {
  const userData = await User.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] !== 0) {
    userData.cartData[req.body.itemId] -= 1;
  }
  await User.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Removed");
});

// Endpoint for getting cart data of user
app.post('/getcart', fetchuser, async (req, res) => {
  const userData = await User.findOne({ _id: req.user.id });
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
  res.json({ success: true, name: req.body.name });
});

// Endpoint for removing products using admin panel
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true, name: req.body.name });
});

// Starting Express Server
app.listen(port, (error) => {
  if (!error) {
    console.log(`Server Running on port ${port}`);
  } else {
    console.log("Error: ", error);
  }
});
