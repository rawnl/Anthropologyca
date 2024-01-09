const { protect } = require('../controllers/authController');

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
  io = require('socket.io')(server, {
    pingTimeout: 60000,
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

  const setReqAuth = (socket, next) => {
    if (socket.handshake.auth.token)
      socket.request.authorization = socket.handshake.auth.token;

    next();
  };

  io.use(
    setReqAuth,
    (req, res, next) => {
      console.log(req);
      console.log(socket.request.authorization);
    },
    protect
  );
  io.on('connection', (socket) => {
    console.log(
      `Socket ${socket.id} connected from origin: ${socket.handshake.headers.origin}`
    );
    socket.onAny((event, ...args) => {
      console.log('[DEBUG]', event, args);
    });

    socket.on('login', (data) => {
      userSocketMap.set(data.user.toString(), socket.id);

      console.log(
        `Login attempt from user : ${data.user} | MESSAGE : ${data.message}`
      );

      socket.emit('login-success', 'SUCCESSFUL LOGIN --1');
      io.to(socket).emit('login-success', 'SUCCESSFUL LOGIN --2');
      io.to(data.socket).emit('login-success', 'SUCCESSFUL LOGIN --3'); // this works
      console.log(userSocketMap);

      // userSocketMap.forEach((element) => {
      //   io.to(element.socket).emit('login-success', 'SUCCESSFUL LOGIN');
      // });
    });

    socket.on('notify', (data) => {
      io.to(data.socket).emit(
        'notify',
        'NOTIFY: @server is notified and sent back this :)'
      );
    });

    socket.on('disconnect', async () => {
      // userSocketMap.delete(userId);
      // console.info(`Client disconnected [id=${socket.id}]`);

      // TO BE TESTED
      const matchingSockets = await io.in(socket.clientID).allSockets();
      const isDisconnected = matchingSockets.size === 0;
      if (isDisconnected) {
        client.connected = false;
        io.to('admins').emit('admin:client_status', {
          id: client.id,
          status: false,
        });
      }
    });
  });
};

exports.sendNotification = (user, key, message) => {
  socket = getUserSocket(user);
  console.log(connectedUsers);
  console.log(user);
  console.log(socket);
  io.to(socket).emit(key, message);
};

// exports.notify = async (key, message) => {
//   io.emit(key, message);
// };

exports.notify = async (type, notification) => {
  try {
    await new Promise((resolve) => {
      setTimeout(() => {
        // io.emit(key, message);
        console.log('userSocketMap : ' + userSocketMap);
        console.log('notification.receivers : ' + notification.receivers);
        if (notification.receivers) {
          notification.receivers.map((receiver) => {
            // const sktID = userSocketMap.get(receiver._id.toString());
            // console.log('sktID : ' + sktID);
            // const targetSocket = io.sockets.connected[sktID];

            // console.log('Receiver IDs:', notification.receivers.map(receiver => receiver._id.toString()));

            const targetSocket = io.sockets.sockets.get(
              userSocketMap.get(receiver._id.toString())
            );

            if (targetSocket) {
              console.log('targetSocket : ' + targetSocket);
              targetSocket.emit(type, notification.content);
            }

            console.log('Receiver ID:', receiver._id.toString());
            console.log(
              'Socket ID from userSocketMap:',
              userSocketMap.get(receiver._id.toString())
            );
            console.log('Target Socket:', targetSocket);
          });
        }
        resolve();
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
};
