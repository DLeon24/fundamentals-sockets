const socket = io();

socket.on('connect', function () {
  console.log('Connected to server');
});

socket.on('disconnect', function () {
  console.log('Lost connection with server');
});

socket.emit(
  'sendMessage',
  {
    user: 'Diego',
    message: 'Hello World',
  },
  function (resp) {
    console.log('Server response: ', resp);
  }
);

socket.on('sendMessage', function (message) {
  console.log('Server: ', message);
});
