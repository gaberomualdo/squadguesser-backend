const mongoose = require('mongoose');

const EmailSubscriberSchema = new mongoose.Schema({
  emailAddress: {
    required: true,
    type: String,
  },
});

module.exports = EmailSubscriber = mongoose.model('email-subscriber', EmailSubscriberSchema);
