let io;
let connectedUsers = [];

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
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log(`a user connected with socketID : .. ${socket.id}`);

    socket.on('login', (data) => {
      console.log(data.socket);
      console.log(
        `Login attempt from user : ${data.user} | MESSAGE : ${data.message}`
      );

      connectedUsers.push({ user: data.user, socket: data.socket });
      console.log(connectedUsers);

      connectedUsers.forEach((element) => {
        io.to(element.socket).emit('login-success', 'SUCCESSFUL LOGIN');
      });
    });

    socket.on('notify', (data) => {
      console.log(data.socket);
      io.to(data.socket).emit(
        'notify',
        'NOTIFY: @server is notified and sent back this :)'
      );
    });

    socket.on('disconnect', () => {
      console.info(`Client disconnected [id=${socket.id}]`);
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

exports.notify = (key, message) => {
  io.emit(key, message);
};
