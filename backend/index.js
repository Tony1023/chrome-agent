const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 7999 });
const puppeteer = require('puppeteer');

let clients = {};

wss.on('connection', (ws) => {
  const id = Math.floor(Math.random() * 360);
  const metadata = { id };

  clients[ws] = { metadata };
  puppeteer.launch({ headless: 'new' }).then((b) => {
    clients[ws].browser = b;
    clients[ws].page = b.newPage();
  });

  ws.on('message', async (message) => {
    try {
      const instruction = JSON.parse(message).instruction;
      console.log(instruction);
      const page = await clients[ws].page;
      await page.goto(`https://${instruction}`);
      // await page.waitForNavigation({ waituntil: 'domcontentloaded' });
      const html = await page.content();
      console.log(html);
      ws.send(JSON.stringify({ html: html }));
    } catch (e) {
      console.log(e);
      ws.send(JSON.stringify({ html: 'Sorry something went wrong. ' }));
    }
  });

  ws.on("close", () => {
    delete clients[ws];
  });
});
