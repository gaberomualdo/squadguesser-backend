const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

// @route   GET api/auth
// @desc    Get user
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  Public
router.post('/', async (req, res) => {
  const { password, username } = req.body;

  try {
    // See if user exists, send error if so
    let user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        errors: [
          {
            msg: 'Invalid username or password.',
          },
        ],
      });
    }

    // check if password is a match
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        errors: [
          {
            msg: 'Invalid username or password.',
          },
        ],
      });
    }

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, config.get('jwtToken'), {}, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/checktoken
// @desc    Check if given JWT token is working and valid!
// @access  private
router.get('/checktoken', auth, async (req, res) => {
  // got past the auth middleware, so it worked!
  res.json({
    msg: 'Token is valid',
  });
});

module.exports = router;
