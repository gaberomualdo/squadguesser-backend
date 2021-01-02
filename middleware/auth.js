const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({
      errors: [
        {
          msg: 'No token, authorization denied',
        },
      ],
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.get('jwtToken'));

    req.user = decoded.user;
    return next();
  } catch (err) {
    return res.status(401).json({
      errors: [
        {
          msg: 'Token is invalid',
        },
      ],
    });
  }
};