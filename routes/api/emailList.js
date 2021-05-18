const config = require('config');
const express = require('express');
const router = express.Router();
const emailValidator = require('email-validator');
const jwt = require('jsonwebtoken');
const EmailSubscriber = require('../../models/EmailSubscriber');

router.put('/subscribe', async (req, res) => {
  try {
    const { emailAddress } = req.query;

    if (!emailAddress) {
      return res.status(400).json({
        message: 'Missing email address.',
      });
    }
    if (!emailValidator.validate(emailAddress)) {
      return res.status(400).json({
        message: 'Invalid email address.',
      });
    }

    let emailSubscriber = await EmailSubscriber.findOne({ emailAddress });

    if (emailSubscriber) {
      return res.status(400).json({
        message: `${emailAddress} is already subscribed to the email list.`,
      });
    }
    emailSubscriber = new EmailSubscriber({ emailAddress });
    emailSubscriber.save();

    return res.json({
      message: `${emailAddress} has been successfully subscribed to the email list!`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.put('/unsubscribe', async (req, res) => {
  try {
    const { token } = req.query;

    let emailAddress;
    try {
      const decoded = jwt.verify(token, config.get('jwtToken'));
      emailAddress = decoded.emailAddress;
    } catch (err) {
      return res.status(400).json({
        message: 'Unsubscribe token is invalid or expired.',
      });
    }

    const emailSubscriber = await EmailSubscriber.findOne({ emailAddress });

    if (emailSubscriber) {
      await EmailSubscriber.findOneAndRemove({ emailAddress });
      return res.json({
        message: `${emailAddress} has been successfully unsubscribed from the email list.`,
      });
    } else {
      return res.status(400).json({
        message: `${emailAddress} is not currently subscribed to the email list.`,
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
