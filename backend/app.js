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
// --- KEEP ALIVE HEARTBEAT ---
// This forces the server to talk to the database every 5 minutes.
// This prevents Aiven from thinking the database is idle and turning it off.
setInterval(async () => {
    try {
        // Run a simple query (SELECT 1) just to wake up the DB
        await sequelize.query('SELECT 1'); 
        console.log('💓 Database Heartbeat sent (Keep-Alive)');
    } catch (error) {
        console.error('❌ Heartbeat failed:', error.message);
    }
}, 5 * 60 * 1000); // Run every 5 minutes
