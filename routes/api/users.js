const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Profile = require('../../models/Profile');

const validatePasswordAndGetError = async (password) => {
  let error;
  let bounds = [8, 20];
  if (!(password.length >= bounds[0] && password.length <= bounds[1])) {
    valid = false;
    error = `Password must be between ${bounds.join('-')} characters.`;
  }
  return error;
};

const validateUsernameAndGetError = async (username, signingUp) => {
  let error;
  try {
    // See if user exists, send error if so
    let user = await User.findOne({ username });
    if (user && signingUp) {
      error = 'Username not available.';
    } else if (!user && !signingUp) {
      error = 'User with username does not exist.';
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }

  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '1234567890';
  let bounds = [4, 20];
  if (!(username.length >= bounds[0] && username.length <= bounds[1])) {
    error = `Username must be between ${bounds.join('-')} characters.`;
  } else if (alphabet.indexOf(username[0]) === -1) {
    error = 'Username must start with a letter.';
  } else {
    const invalidChars = [...new Set(username.split('').filter((e) => (alphabet + numbers + '_').indexOf(e) === -1))];
    if (invalidChars.length > 0) {
      error = `Username cannot include: ${invalidChars.map((e) => `'${e}'`).join(', ')}.`;
    }
  }
  return error;
};

// @route   POST api/users
// @desc    register user
// @access  Public
router.post('/', async (req, res) => {
  const { password, username } = req.body;

  const error = (await validateUsernameAndGetError(username, true)) || (await validatePasswordAndGetError(password));
  if (error) {
    return res.status(400).json({
      errors: [
        {
          msg: error,
        },
      ],
    });
  }

  try {
    let user = new User({
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
      res.json({ token, msg: 'User created successfully.' });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
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

router.post('/validateusername', async (req, res) => {
  const { username, signingUp } = req.body;

  const error = await validateUsernameAndGetError(username, signingUp);

  if (error) {
    res.status(400).json({
      errors: [
        {
          msg: error,
        },
      ],
    });
  } else {
    res.status(200).json({
      msg: 'Username is valid.',
    });
  }
});

module.exports = router;
