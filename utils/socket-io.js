const { socketProtect } = require('../controllers/authController');

let io;
const userSocketMap = new Map();

const getUserSocket = (id) => {
  const user = userSocketMap.find((user) => user.user === id);
  if (user) {
    return user.socket;
  }
  return null;
};

exports.socketConnection = (server) => {
  io = require('socket.io')(server, {
    connectionStateRecovery: {},
    pingTimeout: 160000,
    cors: {
      // origin: '*',
      // origin:
      //   process.env.NODE_ENV === 'production'
      //     ? false
      //     : [
      //         'http://localhost:8080',
      //         'http://127.0.0.1:8080',
      //         'http://localhost:5000',
      //         'http://127.0.0.1:5000',
      //         'http://localhost:5501',
      //         'http://127.0.0.1:5501',
      //       ],
      origin: [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:5501',
        'http://127.0.0.1:5501',
      ],
      credentials: true,
    },
  });

  io.use(socketProtect);

  io.on('connection', (socket) => {
    console.log(
      `Socket ${socket.id} connected from origin: ${socket.handshake.headers.origin}`
    );

    socket.on('login', (data) => {
      console.log(
        `Login attempt from user : ${data.user} | MESSAGE : ${data.message}`
      );

      // Add the connected user to the connected users map
      userSocketMap.set(data.user.toString(), socket.id);
    });

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

    // For debugging purposes
    socket.onAny((event, ...args) => {
      console.log('[DEBUG]: [Received]', event, args);
    });

    socket.onAnyOutgoing((event, ...args) => {
      console.log('[DEBUG]: [Emitted]', event, args);
    });
  });
};

exports.notify = async (type, notification) => {
  try {
    await new Promise((resolve) => {
      setTimeout(() => {
        if (userSocketMap && notification.receivers) {
          notification.receivers.map((receiver) => {
            const targetSocket = io.sockets.sockets.get(
              userSocketMap.get(receiver._id.toString())
            );

            if (targetSocket) {
              targetSocket.emit(type, notification.content);
            }
          });
        }
        resolve();
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
};
