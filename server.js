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

// const io = require('socket.io')(server, {
//   pingTimeout: 60000,
//   cors: {
//     origin: 'http://127.0.0.1:3000',
//   },
// });

// io.on('connection', (socket) => {
//   console.log('connected to socket.io');
// });
