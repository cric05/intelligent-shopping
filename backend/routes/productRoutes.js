const express = require('express');
const { comparePrices } = require('../controllers/productController');

const router = express.Router();

router.get('/compare', comparePrices);

module.exports = router;