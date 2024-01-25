import WebSocket from 'ws';
const socket = new WebSocket('ws://localhost:11200/mpi/ws');

socket.on('open', () => {
  console.log('Connected');

  socket.send(JSON.stringify({
    type: 'get_states'
  }));
});

socket.on('message', (data) => {
  console.log('Message received: ', data.toString());
});
