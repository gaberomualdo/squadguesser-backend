const fs = require('fs');
const config = require('config');
const stftime = require('stftime');
const Mustache = require('mustache');
const getEmailUnsubscribeToken = require('./getEmailUnsubscribeToken');
const sendEmail = require('../lib/sendEmail');
const EmailSubscriber = require('../models/EmailSubscriber');
const baseURL = config.get('frontendBaseURL');
const appName = config.get('appName');
const { getDateDaysBeforeToday, getDateStr } = require('../lib/utils');

const getDayURL = (daysBefore) => {
  return `${baseURL}/daily/${getDateStr(getDateDaysBeforeToday(daysBefore))}`;
};

const sendWeeklyNewsletter = () => {
  const emailSubscribers = EmailSubscriber.find();
  const emailTemplateHTML = fs.readFileSync('../emailTemplates/weeklyChallenges.html');
  const emailTemplateText = fs.readFileSync('../emailTemplates/weeklyChallenges.txt');

  const defaultOpts = {
    logoLightURL: `${baseURL}/email-assets/logo-light.png`,
    logoURL: `${baseURL}/email-assets/logo.png`,
    appName,
    dateExpression: stftime('%A, %B %e, %Y'),

    saturdayURL: getDayURL(7),
    sundayURL: getDayURL(6),
    mondayURL: getDayURL(5),
    tuesdayURL: getDayURL(4),
    wednesdayURL: getDayURL(3),
    thursdayURL: getDayURL(2),
    yesterdayURL: getDayURL(1),

    aboutURL: `${baseURL}/about`,
    teamURL: `${baseURL}/team`,
    termsURL: `${baseURL}/terms`,
  };

  emailSubscribers.forEach((emailSubscriber) => {
    const { emailAddress } = emailSubscriber;
    const opts = {
      ...defaultOpts,
      unsubscribeURL: `${baseURL}/email-unsubscribe?token=${getEmailUnsubscribeToken(emailAddress)}`,
      emailAddress,
    };
    const emailHTMLContent = Mustache.render(emailTemplateHTML, opts);
    const emailTextContent = Mustache.render(emailTemplateText, opts);

    sendEmail(emailAddress, `This Week's ${appName} Games For You`, emailTextContent, emailHTMLContent);
  });
};
module.exports = sendWeeklyNewsletter;
