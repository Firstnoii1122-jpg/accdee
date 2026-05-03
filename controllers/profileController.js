const User = require('../models/userModel');

const getProfile = async (req, res) => {
  try {
    const user = await User.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again' });
  }
};

module.exports = { getProfile };
