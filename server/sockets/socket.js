const { io } = require('../server');

io.on('connection', (client) => {
  console.log('User connected');
  client.emit('sendMessage', {
    user: 'Admin',
    message: 'Welcome to his app',
  });

  client.on('disconnect', () => {
    console.log('User disconnected');
  });

  client.on('sendMessage', (data, callback) => {
    console.log(data);

    client.broadcast.emit('sendMessage', data);
    /*if (message.user) {
      callback({
        resp: 'Everything its ok!',
      });
    } else {
      callback({
        resp: 'Everything its bad!',
      });
    }*/
  });
});
