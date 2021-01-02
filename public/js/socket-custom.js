var socket = io();

socket.on('connect', function () {
  console.log('connected with server');
});

socket.on('disconnect', function () {
  console.log('losted connection with server');
});

socket.emit(
  'sendMessage',
  {
    user: 'Diego',
    message: 'Hola Mundo',
  },
  function (resp) {
    console.log('Server response: ', resp);
  }
);

socket.on('sendMessage', function (message) {
  console.log('Server: ', message);
});
