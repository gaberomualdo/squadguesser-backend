const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (emailAddress) => {
  return jwt.sign(
    {
      emailAddress,
    },
    config.get('jwtToken'),
    {}
  );
};
