// client/client.js
const WebSocket = require('ws');
const http = require('http');

const LOCAL_PORT = 9000;
const REMOTE_WSS = 'wss://tunnel.cargo-fox.com';

const ws = new WebSocket(REMOTE_WSS);

ws.on('open', () => {
  console.log('✅ Connected to tunnel server');
});

ws.on('message', (msg) => {
  const reqData = JSON.parse(msg);
  const { correlationId, method, url, headers, body } = reqData;

  const options = {
    hostname: 'localhost',
    port: LOCAL_PORT,
    path: url,
    method,
    headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const chunks = [];
    proxyRes.on('data', chunk => chunks.push(chunk));
    proxyRes.on('end', () => {
      const response = {
        correlationId,
        statusCode: proxyRes.statusCode,
        headers: proxyRes.headers,
        body: Buffer.concat(chunks).toString(),
      };
      ws.send(JSON.stringify(response));
    });
  });

  proxyReq.on('error', (err) => {
    console.error('❌ Error connecting to local server:', err.message);
    const response = {
      correlationId,
      statusCode: 502,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Could not connect to local app',
    };
    ws.send(JSON.stringify(response));
  });

  if (body) {
    proxyReq.write(body);
  }

  proxyReq.end();
});
