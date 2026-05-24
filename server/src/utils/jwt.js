const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccess(payload, opts = {}) {
  return jwt.sign(payload, env.jwtAccessSecret, { algorithm: 'HS256', expiresIn: env.jwtAccessExpiresIn, ...opts });
}

function signRefresh(payload, opts = {}) {
  return jwt.sign(payload, env.jwtRefreshSecret, { algorithm: 'HS256', expiresIn: env.jwtRefreshExpiresIn, ...opts });
}

function verifyAccess(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefresh(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
