const puppeteer = require('puppeteer');
const readline = require('readline');
require('dotenv').config()
const domParser = require('dom-parser');
const openai = require('openai');

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
const getReadingListFromNotion = async () => {
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
  const tableHTML = await page.$eval('div.notion-table-view', e => e.innerHTML);
  await browser.close();
  return tableHTML;
};

const askGPT = async htmlContent => {
  const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await client.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are HTML language master that can understand HTML files and see what the page is about." },
      { role: 'user', content: 'What are the books to read in the below page?' },
      { role: 'user', content: htmlContent },
    ],
  });

  return completion;
}

const main = async () => {
  let tableHTML = await getReadingListFromNotion();
  tableHTML = tableHTML.replace(/style="[^\"]*"/gi, '');
  tableHTML = tableHTML.replace(/d="[^\"]*"/gi, '');
  console.log(tableHTML);

  console.log((await askGPT(tableHTML)).choices[0].message.content);
};

main();
