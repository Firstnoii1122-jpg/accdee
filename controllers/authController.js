const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/userModel');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email and password' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId      = await User.createUser(username, email, hashedPassword);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data   : { id: newUserId, username, email }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

const login = async (req, res) => {
  try {
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password =  req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findUserByEmail(email);
    const passwordMatch = user && await bcrypt.compare(password, user.password);

    if (!user || !passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

module.exports = { register, login };
