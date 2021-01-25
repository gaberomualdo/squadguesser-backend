const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');

const formatProfile = async (e) => e.populate('user', ['-password']).select('rating gamesPlayed ratingHistory');

const getProfileLeaderboardPos = async (userId) => {
  const profiles = await formatProfile(Profile.find().sort('-rating'));
  for (let i = 0; i < profiles.length; i++) {
    if (profiles[i].toObject().user._id == userId) {
      return i + 1;
    }
  }
};

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await formatProfile(Profile.findOne({ user: req.user.id }));
    if (!profile) {
      return res.status(400).json({
        errors: [
          {
            msg: 'No profile found for given user',
          },
        ],
      });
    }
    const leaderboardPos = await getProfileLeaderboardPos(req.user.id);
    res.json({ ...profile.toObject(), leaderboardPosition: leaderboardPos });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/me/rating
// @desc    Get current user's rating
// @access  Private
router.get('/me/rating', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(400).json({
        errors: [
          {
            msg: 'No profile found for given user',
          },
        ],
      });
    }
    res.json({
      rating: profile.rating,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
  return; // this is not yet useful so better to just remove it.
  try {
    const profiles = await formatProfile(Profile.find());
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET top/:count
// @desc    Get top 'count' profiles
// @access  Public
router.get('/top/:count', async (req, res) => {
  try {
    let profiles = await formatProfile(Profile.find().sort('-rating').limit(parseInt(req.params.count)));
    profiles = profiles.map((e, i) => {
      let r = e.toObject();
      r.gamesPlayedCount = r.gamesPlayed.length;
      delete r.gamesPlayed;
      return r;
    });
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await formatProfile(Profile.findOne({ user: req.params.user_id }));
    if (!profile) return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/profile/game
// @desc    Add profile game
// @access  Private
router.put('/me/game', auth, async (req, res) => {
  const { type, league, correctAnswer, won, hintsUsed, wrongGuesses } = req.body;
  const newGamePlayed = { type, league, correctAnswer, won, hintsUsed, wrongGuesses };

  // decide whether to increase or decrease rating
  const wrongAndHintsLimit = 3;
  const ratingMultiplier = won
    ? wrongGuesses + hintsUsed < wrongAndHintsLimit
      ? 1 / (wrongGuesses + hintsUsed + 1)
      : -0.4 * (wrongAndHintsLimit + 1 - wrongGuesses + hintsUsed)
    : -1;

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.gamesPlayed.unshift(newGamePlayed);

    if (profile.ratingHistory.length === 0) {
      profile.ratingHistory.push({
        rating: profile.rating,
      });
    }

    const ratingChange = Math.min((62 / (profile.rating / 400)) * ratingMultiplier, 150);
    profile.rating = Math.max(Math.ceil(profile.rating + ratingChange), 100);

    profile.ratingHistory.push({
      rating: profile.rating,
    });

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
