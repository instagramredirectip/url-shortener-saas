const crypto = require('crypto');

const generateShortCode = (length = 6) => {
  return crypto.randomBytes(length)
    .toString('base64url')
    .substring(0, length);
};

module.exports = { generateShortCode };