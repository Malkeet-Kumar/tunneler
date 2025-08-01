const net = require("net");
const PUBLIC_PORT = 8080;

const server = net.createServer((incomingSocket) => {
  console.log("New public request received.");
  const tunnelSocket = net.connect({ host: "127.0.0.1", port: 9000 }, () => {
    incomingSocket.pipe(tunnelSocket);
    tunnelSocket.pipe(incomingSocket);
  });

  tunnelSocket.on("error", (err) => {
    console.error("Error connecting to tunnel client:", err.message);
    incomingSocket.destroy();
  });
});

server.listen(PUBLIC_PORT, () => {
  console.log(`Tunnel server running on port ${PUBLIC_PORT}`);
});
