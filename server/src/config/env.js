const dotenv = require('dotenv');

dotenv.config();

function normalizeOrigin(value, fallback) {
  if (!value) return fallback;
  return value.replace(/\/$/, '');
}

const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  clientUrl: normalizeOrigin(process.env.CLIENT_URL, 'http://localhost:5173')
};

module.exports = env;
