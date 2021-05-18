const nodemailer = require('nodemailer');
const config = require('config');

const botEmailAddress = config.get('botEmailAddress');
const botEmailDisplayName = config.get('botEmailDisplayName');
const botEmailPassword = config.get('botEmailPassword');
const botEmailHost = config.get('botEmailHost');

module.exports = async (emailAddress, subject, text, html) => {
  try {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: botEmailHost,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: botEmailAddress,
        pass: botEmailPassword,
      },
    });

    // send mail with defined transport object
    await transporter.sendMail({
      from: `"${botEmailDisplayName}" <${botEmailAddress}>`,
      to: emailAddress,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error(err);
  }
};
