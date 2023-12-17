// Config File setup
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// Database Connection - Atlas
const mongoose = require('mongoose');

const dbUri = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(dbUri).then(() => {
  console.log('Database connected.');
});

// Setting up the server
const app = require('./app');
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port: ${port}..`);
});

const { socketConnection } = require('./utils/socket-io');
socketConnection(server);
