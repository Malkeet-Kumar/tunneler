// server/server.js
const http = require('http');
const WebSocket = require('ws');

let clientSocket = null;
const pendingResponses = new Map();

const server = http.createServer((req, res) => {
  if (!clientSocket || clientSocket.readyState !== WebSocket.OPEN) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    return res.end('Tunnel client not connected');
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString();

    const correlationId = Math.random().toString(36).substring(2);
    const payload = {
      correlationId,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body
    };

    // Save res in pending map
    pendingResponses.set(correlationId, res);

    // Send to client
    clientSocket.send(JSON.stringify(payload));

    // Timeout fallback
    setTimeout(() => {
      if (pendingResponses.has(correlationId)) {
        res.writeHead(504, { 'Content-Type': 'text/plain' });
        res.end('Tunnel timeout: No response from client.');
        pendingResponses.delete(correlationId);
      }
    }, 10000); // 10s timeout
  });
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('✅ Tunnel client connected');
  clientSocket = ws;

  ws.on('message', (msg) => {
    const response = JSON.parse(msg);
    const res = pendingResponses.get(response.correlationId);

    if (res) {
      res.writeHead(response.statusCode || 200, response.headers || {});
      res.end(response.body || '');
      pendingResponses.delete(response.correlationId);
    }
  });

  ws.on('close', () => {
    console.log('🚫 Client disconnected');
    clientSocket = null;
  });
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(8080, () => {
  console.log('🚀 Tunnel server listening on http://localhost:8080');
});
