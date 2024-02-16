const { socketProtect } = require('../controllers/authController');

let io;
let redisClient;
// const userSocketMap = new Map();

// const getUserSocket = (id) => {
//   const user = userSocketMap.find((user) => user.user === id);
//   if (user) {
//     return user.socket;
//   }
//   return null;
// };

// const getUserSet = async (id) => {
//   // const user = userSocketMap.get(id).push(socket);
//   return new Promise((resolve, reject) => {
//     redisClient.smembers(`user:${id}`, (error, result) => {
//       if (error) {
//         console.error('Error: createUserSet() =>', error);
//         reject(error);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// };

// Creates the set for user from the first connection attempt(first socket)
const createUserSet = async (id, socket) => {
  // const user = userSocketMap.get(id).push(socket);
  return new Promise((resolve, reject) => {
    redisClient.sadd(`user:${id}`, `${socket}`, (error, result) => {
      if (error) {
        console.error('Error: createUserSet() =>', error);
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// Cheks if the user is connected
const isConnected = async (id) => {
  return new Promise((resolve, reject) => {
    redisClient.sismember(`user:`, `${id}`, (error, result) => {
      if (error) {
        console.error('Error: isConnected() =>', error);
        reject(error);
      } else {
        console.log(result);
        resolve(result === 1);
      }
    });
  });
};

// Add the connected user's socket (another tab example)
const addUserSocket = async (id, socket) => {
  // const user = userSocketMap.get(id).push(socket);
  return new Promise((resolve, reject) => {
    redisClient.sadd(`user:${id}`, `${socket}`, (error, result) => {
      if (error) {
        console.error('Error: addUserSocket() =>', error);
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

const getUserSockets = async (id) => {
  // get all the sockets of this user
  console.log('Calling getUserSockets with id = ' + id);
  return new Promise((resolve, reject) => {
    redisClient.smembers(`user:${id}`, (error, result) => {
      if (error) {
        console.error('Error: getUserSockets() =>', error);
        reject(error);
      } else {
        console.log('getUserSockets : ' + typeof result);
        console.log('getUserSockets : ' + result.length);
        // const socketsArray = result.split(',');
        // console.log('socketsArray: ' + socketsArray);
        // console.log(socketsArray.length);
        // const socketIdsArray = Object.values(result);

        const res = result.toString().split(',');
        // console.log('res : ' + res);
        // console.log(typeof res);

        // console.log(res.split(','));
        // console.log(typeof res.split(','));

        // const socketsarray = res.split(',');

        resolve(res);
      }
    });
  });
};

const getAllConnectedUsers = async () => {
  return new Promise((resolve, reject) => {
    redisClient.keys('user:*', (error, result) => {
      if (error) {
        console.error('Error: getAllConnectedUsers() =>', error);
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

exports.socketConnection = (server, adapter, client) => {
  redisClient = client;
  io = require('socket.io')(server, {
    connectionStateRecovery: {},
    // set up the adapter on each worker thread
    adapter: adapter,
    pingTimeout: 160000,
    cors: {
      // origin: '*',
      origin:
        process.env.NODE_ENV === 'production'
          ? false
          : [
              'http://localhost:8080',
              'http://127.0.0.1:8080',
              'http://localhost:5000',
              'http://127.0.0.1:5000',
              'http://localhost:5501',
              'http://127.0.0.1:5501',

              'https://localhost:8080',
              'https://127.0.0.1:8080',
              'https://localhost:5000',
              'https://127.0.0.1:5000',
              'https://localhost:5501',
              'https://127.0.0.1:5501',
            ],
      // origin: [
      //   'http://localhost:8080',
      //   'http://127.0.0.1:8080',
      //   'http://localhost:5000',
      //   'http://127.0.0.1:5000',
      //   'http://localhost:5501',
      //   'http://127.0.0.1:5501',
      // ],
      credentials: true,
    },
  });

  io.use(socketProtect);

  io.on('connection', (socket) => {
    // For debugging purposes
    socket.onAny((event, ...args) => {
      console.log('[DEBUG]: [Received]', event, args);
    });

    socket.onAnyOutgoing((event, ...args) => {
      console.log('[DEBUG]: [Emitted]', event, args);
    });

    console.log(
      `Socket ${socket.id} connected from origin: ${socket.handshake.headers.origin}`
    );

    socket.on('login', async (data) => {
      console.log(
        `Login attempt from user : ${data.user} | MESSAGE : ${data.message}`
      );

      // works fine
      const usrs = await getAllConnectedUsers();
      console.log(typeof usrs);
      console.log(usrs);

      // Add the connected user to the connected users map
      // userSocketMap.set(data.user.toString(), [socket.id]);

      // 01. check if the user is already connected :
      const connected = await isConnected(data.user.toString());
      if (connected) {
        // a. add the user socket if connected
        console.log('user already connected');
        await addUserSocket(data.user.toString(), socket.id);
      } else {
        // b. create the set for the user and add the socket of the user if it's the firs tconnection attempt:
        console.log('user first connection');
        await createUserSet(data.user.toString(), socket.id);
      }
    });

    // To complete ...
    socket.on('disconnect', async () => {
      // userSocketMap.delete(userId);
      console.info(`Client disconnected [id=${socket.id}]`);
      // TO BE TESTED
      // const matchingSockets = await io.in(socket.clientID).allSockets();
      // const isDisconnected = matchingSockets.size === 0;
      // if (isDisconnected) {
      //   client.connected = false;
      //   io.to('admins').emit('admin:client_status', {
      //     id: client.id,
      //     status: false,
      //   });
      // }
    });
  });
};

exports.notify = async (type, notification) => {
  console.log('notification: ' + notification);

  if (notification.receivers) {
    notification.receivers.forEach(async (receiver) => {
      console.log(`receiver : ${receiver._id}`);
      const targetSockets = await getUserSockets(receiver._id);
      console.log('targetSockets: ' + targetSockets);

      if (targetSockets && targetSockets.length > 0) {
        const res = targetSockets.toString();
        console.log('res : ' + res);
        console.log(typeof res);

        console.log(res.split(','));
        console.log(typeof res.split(','));

        const socketsarray = res.split(',');
        socketsarray.forEach((socket) => {
          const existedSocket = io.sockets.sockets.get(socket);
          if (existedSocket) {
            existedSocket.emit(type, notification.content);
          }
        });
      }
    });
  }
  // try {
  //   await new Promise((resolve) => {
  //     setTimeout(async () => {
  //       // const connectedUsers = await getAllConnectedUsers();
  //       // console.log(typeof connectedUsers);
  //       // console.log(connectedUsers);

  //       // connectedUsers.length > 0 &&
  //       if (notification.receivers) {
  //         // notification.receivers.map(async (receiver) => {
  //         //   // const targetSockets = io.sockets.sockets.get(
  //         //   //   userSocketMap.get(receiver._id.toString())
  //         //   // );

  //         //   const targetSockets = await getUserSockets(receiver);

  //         //   console.log(targetSockets);
  //         //   // if (targetSockets && targetSockets.length > 0) {
  //         //   //   targetSockets.forEach((socket) => {
  //         //   //     socket.emit(type, notification.content);
  //         //   //   });
  //         //   // }
  //         // });

  //         notification.receivers.forEach(async (receiver) => {
  //           const targetSockets = await getUserSockets(receiver);
  //           console.log('targetSockets: ' + targetSockets);
  //         });
  //       }
  //       resolve();
  //     }, 1000000);
  //   });
  // } catch (error) {
  //   console.log(error);
  // }
};
