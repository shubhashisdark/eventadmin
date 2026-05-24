const app = require('./app');
const env = require('./config/env');
const connectDatabase = require('./config/db');

async function startServer() {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
