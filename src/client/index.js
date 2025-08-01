const net = require('net');

const LOCAL_PORT = 3000;            // The app you want to expose
const TUNNEL_SERVER_HOST = 'your.server.ip';
const TUNNEL_SERVER_PORT = 8080;

const server = net.createServer((tunnelSocket) => {
  const localSocket = net.connect({ port: LOCAL_PORT }, () => {
    console.log('Tunnel connection established to local app.');
    tunnelSocket.pipe(localSocket);
    localSocket.pipe(tunnelSocket);
  });

  localSocket.on('error', (err) => {
    console.error('Local app error:', err.message);
    tunnelSocket.destroy();
  });
});

server.listen(9000, () => {
  console.log('Client tunnel listener waiting on port 9000');
});

net.connect({ host: TUNNEL_SERVER_HOST, port: TUNNEL_SERVER_PORT });
