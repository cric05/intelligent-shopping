const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- Helper Functions (Cleaned Up) ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// --- Controller Functions ---

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User with that email already exists' });
    }
    // The beforeCreate hook in the model will hash this password
     const user = await User.create({ name, email, password });
    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name, 
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      throw new Error('User creation failed');
    }
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

/**
 * @desc    Authenticate a user & get a token (Login)
 * @route   POST /api/auth/login
 */
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

/**
 * @desc    Directly reset a user's password using their email
 * @route   POST /api/auth/direct-reset
 */
exports.directPasswordReset = async (req, res) => {
  const { email, password } = req.body;

  // --- DEBUGGING ---
  console.log('--- Direct Password Reset Request ---');
  console.log('Email:', email);
  // -----------------

  try {
    // 1. Find the user by their email address
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('Reset Error: User not found.');
      return res.status(404).json({ message: 'User with that email was not found.' });
    }
    console.log('User found, proceeding to update password.');

    // 2. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Update the user's password directly in the database using a WHERE clause.
    // This is the most reliable way to perform an update.
    await User.update(
      { password: hashedPassword },
      { where: { email: email } }
    );
    
    console.log('✅ Password successfully updated in the database.');

    // 4. Send a success response
    res.status(200).json({ success: true, message: 'Password has been updated successfully.' });

  } catch (error) {
    console.error('!!! SERVER ERROR during direct password reset:', error);
    res.status(500).json({ message: 'Server error: Could not update password.' });
  }
};