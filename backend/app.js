require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const historyRoutes = require('./routes/historyRoutes');


// --- CRITICAL MIDDLEWARE SETUP ---

// 1. Enable CORS for all routes and origins.
// This tells the server to accept requests from your frontend (running on a different port).
app.use(cors({ origin: '*' }));

// 2. Enable the Express JSON parser to read the request body.
app.use(express.json());


app.get('/', (req, res) => {
  res.json({ message: 'CORS is enabled for all routes!' });
})

console.log("in")

// --- ROUTES ---
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/history', historyRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});