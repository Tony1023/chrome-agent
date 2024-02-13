const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 7999 });

let clients = {};

wss.on('connection', (ws) => {
  const id = Math.floor(Math.random() * 360);
  const metadata = { id };

  clients[ws] = metadata;

  ws.on('message', (message) => {
    let instruction;
    try {
      instruction = JSON.parse(message).instruction;
    } catch (e) {
      console.log(e);
    }
    console.log(instruction);
    ws.send(JSON.stringify({ message: `Received ${instruction}` }));
  });

  ws.on("close", () => {
    delete clients[ws];
  });
});
