const dotenv = require('dotenv');
const mongoose = require('mongoose');

const { availableParallelism } = require('node:os');
const cluster = require('node:cluster');
const { createAdapter, setupPrimary } = require('@socket.io/cluster-adapter');
// const { createClient } = require('redis');

const Redis = require('ioredis');

const app = require('./app');
const { socketConnection } = require('./utils/socket-io');

const port = process.env.PORT || 5000;

// Config File setup
dotenv.config({ path: './config.env' });

// Database Connection - Atlas
const dbUri = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(dbUri).then(() => {
  console.log('Database connected.');
});

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  // create one worker per available core
  for (let i = 0; i < numCPUs - 3; i++) {
    cluster.fork({
      PORT: port + i,
    });
  }

  // set up the adapter on the primary thread
  return setupPrimary();
}

async function main() {
  // 01. Create Redis Client

  // const redisClient = createClient({
  //   url:
  //     process.env.NODE_ENV === 'production'
  //       ? process.env.INTERNAL_REDIS_URL
  //       : process.env.EXTERNAL_REDIS_URL,
  //   // connectTimeout: 5000,
  // });

  ////////////////////////////////////////////////////
  //////////// REDIS ON RENDER ///////////////////////
  ////////////////////////////////////////////////////

  const redisClient = new Redis(
    process.env.NODE_ENV === 'production'
      ? process.env.INTERNAL_REDIS_URL
      : process.env.EXTERNAL_REDIS_URL
  );

  ////////////////////////////////////////////////////
  ////////////////////////////////////////////////////

  // const redisClient = createClient({
  //   password: process.env.REDIS_PASSWORD, //'IPxFL9Hz9oGtQ2QZexvGF0U9rOZslI4L',
  //   socket: {
  //     host: process.env.REDIS_HOST, //'redis-14306.c281.us-east-1-2.ec2.cloud.redislabs.com',
  //     port: process.env.REDIS_PORT, //14306
  //   },
  // });

  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  // await redisClient.connect();

  console.log('Redis Client connected.');

  // 02. Setting up the server
  const server = app.listen(port, () => {
    console.log(
      `App running on port: ${port}.. at ${new Date().toLocaleString()}`
    );
  });

  // 03. Initialising socket.io
  const adapter = createAdapter();
  socketConnection(server, adapter, redisClient);
}

main();
