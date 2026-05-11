// Configuration for external APIs
module.exports = {
  // --- SCRAPERAPI CONFIGURATION (The primary source now) ---
  SCRAPER_API: {
    host: "api.scraperapi.com",
    key: "bb96fdc0a5e058a6ceebce1fc63d46fe", // <-- REPLACE WITH YOUR ACTUAL KEY
  },

  // NOTE: All previous RapidAPI keys for AMAZON, FLIPKART, EBAY, and WALMART
  // have been removed to avoid confusion and keep the configuration clean,
  // as the corresponding fetch functions in productController.js now use SCRAPER_API.
};
