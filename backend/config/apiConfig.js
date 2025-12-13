// Configuration for external APIs

module.exports = {
  SCRAPER_API: {
    host: "api.scraperapi.com",
    // logic: Look for Env Variable, if not found, use your local key (optional)
    key: process.env.SCRAPER_API_KEY, 
  },
};