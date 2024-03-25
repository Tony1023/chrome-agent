const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 7999 });
const puppeteer = require('puppeteer');

let clients = {};

wss.on('connection', async (ws) => {
  const id = Math.floor(Math.random() * 360);
  const metadata = { id };

  let browser = await puppeteer.launch({ headless: 'new' });
  let page = await browser.newPage();
  clients[ws] = { metadata, browser, page };

  ws.on('message', async (message) => {
    try {
      let instruction;
      instruction = JSON.parse(message).instruction;
      console.log(instruction);
      await page.goto(`https://${instruction}`);
      await page.waitForNavigation({ waituntil: 'domcontentloaded' });
      const html = await page.content();
      console.log(html);
      ws.send(JSON.stringify({ html: html }));
    } catch (e) {
      console.log(e);
      ws.send(JSON.stringify({ html: 'Sorry something went wrong. '}));
    }
  });

  ws.on("close", () => {
    delete clients[ws];
  });
});
