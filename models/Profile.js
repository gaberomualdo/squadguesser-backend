const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  rating: {
    required: true,
    type: Number,
    default: 1000,
  },
  ratingHistory: [
    {
      rating: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
  ],
  gamesPlayed: [
    {
      type: {
        type: String,
        required: true,
        default: 'nationality',
      },
      league: {
        type: String,
        required: true,
      },
      correctAnswer: {
        type: String,
        required: true,
      },
      won: {
        type: Boolean,
        required: true,
      },
      hintsUsed: {
        type: Number,
        required: true,
      },
      wrongGuesses: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
  ],
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
