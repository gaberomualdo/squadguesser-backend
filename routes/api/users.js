const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   POST api/users
// @desc    register user
// @access  Public
router.post('/', async (req, res) => {
  const { password, username } = req.body;

  try {
    // See if user exists, send error if so
    let user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({
        errors: [
          {
            msg: 'User already exists',
          },
        ],
      });
    }

    user = new User({
      username,
      password,
    });

    // Encrypt password w/bcrypt
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // create profile
    const profile = new Profile({
      user: user.id,
      gamesPlayed: [],
    });

    await profile.save();

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, config.get('jwtToken'), {}, (err, token) => {
      if (err) throw err;
      res.json({ token, msg: 'User created' });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  GET api/users
// @desc   get all users
// @access public
router.get('/', async (req, res) => {
  // show username and date
  let users = await User.find().select('username date');
  res.json(users);
});

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id }).select('username date');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/me
// @desc    Delete profile and user user
// @access  Private
router.delete('/me', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({
      msg: 'User deleted',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
