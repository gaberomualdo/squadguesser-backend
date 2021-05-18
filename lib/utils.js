const urljoin = require('url-join');
const SQUADS_SITE_BASE_URL = 'https://www.fifaindex.com/';

const makeURL = (urlPath) => {
  return urljoin(SQUADS_SITE_BASE_URL, urlPath);
};
const getDateStr = (date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
};
const getDateDaysBeforeToday = (days) => {
  // some code from SO
  today = new Date();
  yesterday = new Date(today);
  yesterday.setDate(today.getDate() - days);
  return yesterday;
};

module.exports = { makeURL, getDateDaysBeforeToday, getDateStr };
