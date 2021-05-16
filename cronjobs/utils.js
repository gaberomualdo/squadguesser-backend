const urljoin = require('url-join');
const SQUADS_SITE_BASE_URL = 'https://www.fifaindex.com/';

const makeURL = (urlPath) => {
  return urljoin(SQUADS_SITE_BASE_URL, urlPath);
};

module.exports = { makeURL };
