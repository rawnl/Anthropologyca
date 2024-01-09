const { socketProtect } = require('../controllers/authController');
const { Server } = require('socket.io');

let io;
const userSocketMap = new Map();

const getUserSocket = (id) => {
  const user = connectedUsers.find((user) => user.user === id);
  if (user) {
    return user.socket;
  }
  return null;
};

exports.socketConnection = (server) => {
  io = new Server(server, {
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
            ],
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

      // 1.Add the connected user to the connected users map
      userSocketMap.set(data.user.toString(), socket.id);

      // 2. Notify the connected user
      io.to(data.socket).emit('login-success', 'SUCCESSFUL LOGIN');
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
      console.log('[DEBUG]', event, args);
    });
  });
};

exports.sendNotification = (user, key, message) => {
  socket = getUserSocket(user);
  io.to(socket).emit(key, message);
};

exports.notify = async (type, notification) => {
  try {
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log('userSocketMap : ' + userSocketMap);
        console.log('notification.receivers : ' + notification.receivers);
        if (notification.receivers) {
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
