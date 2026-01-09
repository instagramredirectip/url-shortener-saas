const crypto = require('crypto');

// Generates a random URL-safe string of specified length
// Characters: a-z, A-Z, 0-9
const generateShortCode = (length = 6) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    // Map the random byte to our charset
    const randomIndex = randomBytes[i] % charset.length;
    result += charset[randomIndex];
  }
  
  return result;
};

module.exports = generateShortCode;