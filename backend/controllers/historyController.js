const { SearchHistory } = require('../models');

// @desc    Get user's search history
// @route   GET /api/history
exports.getSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 10 // Get the 10 most recent searches
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a new search to history
// @route   POST /api/history
exports.addSearchHistory = async (req, res) => {
  const { query } = req.body;
  try {
    // Prevent saving duplicate consecutive searches
    const lastSearch = await SearchHistory.findOne({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
    });

    if (lastSearch && lastSearch.query.toLowerCase() === query.toLowerCase()) {
        return res.status(200).json(lastSearch);
    }
    
    const newSearch = await SearchHistory.create({
      query,
      userId: req.user.id
    });
    res.status(201).json(newSearch);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};