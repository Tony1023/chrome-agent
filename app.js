const puppeteer = require('puppeteer');
const readline = require('readline');
const fs = require('fs');
require('dotenv').config()
const openai = require('openai');
const { setTimeout } = require("timers/promises");
const cheerio = require('cheerio');

const getTemporaryLoginCode = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question('Paste the temporary login code: ', ans => {
    rl.close();
    resolve(ans);
  }))
}

// Using the default reading list template when you first create your personal workspace on notion.
const openNotionPage = async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.goto('https://www.notion.so/login');

  await page.setViewport({ width: 1080, height: 1024 });

  const emailInput = await page.waitForSelector('#notion-email-input-2');
  await emailInput.type(process.env.NOTION_EMAIL, { delay: 100 });

  const continueWithEmailButton = await page.waitForSelector('div ::-p-text(Continue with email)');
  await continueWithEmailButton.click();

  const passInput = await page.waitForSelector('#notion-password-input-1')

  let continueWithPasswordButton = null;
  try {
    continueWithPasswordButton = await page.waitForSelector('div ::-p-text(Continue with password)', { timeout: 5000 });
  } catch (e) {
    console.log('Looks Notion wants you to use the temporary code they sent you. Please check your email.');
  }

  if (continueWithPasswordButton) {
    console.log('Entering password: ' + process.env.NOTION_PASSWORD);
    await passInput.type(process.env.NOTION_PASSWORD, { delay: 100 });
    await continueWithPasswordButton.click();
  } else {
    const continueWithCodeButton = await page.waitForSelector('div ::-p-text(Continue with login code)');
    const code = await getTemporaryLoginCode();
    await passInput.type(code);
    await continueWithCodeButton.click();
  }

  await page.waitForNavigation({ waituntil: 'domcontentloaded' });
  await page.waitForSelector('div ::-p-text(Reading List)');
  await page.waitForSelector('div ::-p-text(Completed)');
  await setTimeout(10000);

  // const tableHTML = await page.$eval('div.notion-table-view', e => e.innerHTML);
  return page;
};

const askGPT = async htmlContent => {
  const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await client.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "You are HTML parser that can understand HTML files and find HTML elements to interact for specific actions required. For example, you can locate the delete button if the action is to delete an item." },
      { role: 'user', content: htmlContent },
      { role: 'user', content: 'In the above page, can you please locate the HTML element to add a new reading item in the page?' },
    ],
  });

  return completion;
}

const main = async () => {
  let content;
  let page = await openNotionPage();
  try {
    content = await page.content();
    fs.writeFileSync('./page_content.html', content);
  } catch (e) {
    console.log(e);
  }

  try {
    content = fs.readFileSync('./page_content.html', { encoding: 'utf8' });
  } catch (e) {
    console.log(e);
  }

  let $ = cheerio.load(content);
  $('*').each((i, e) => {
    const allAttributes = e.attribs;
    e.attribs = {};
    if (allAttributes.id) {
      e.attribs['id'] = allAttributes.id;
    }
    if (allAttributes.class) {
      e.attribs['class'] = allAttributes.class;
    }
  });
  console.log((await askGPT($.html())).choices[0].message.content);

};

main();
