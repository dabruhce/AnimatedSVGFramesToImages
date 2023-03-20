const puppeteer = require('puppeteer');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

let previousScreenshot = null;

const captureSvgAnimation = async (options) => {
 
  const { input, width, height, start, end, output, naming } = options;
  const browser = await puppeteer.launch({
    defaultViewport: { width: parseInt(width), height: parseInt(height) }
  });
  
  const page = await browser.newPage();
  let frame = parseInt(start);

  await page.exposeFunction('takeFrame', async () => {
    if (frame === parseInt(options.end)) {
      process.exit(0)
    }    

    const [constant, ...namingParts] = naming.split('%');
    const [replacement, much] = namingParts[0];
    const extension = namingParts[0].split('.');

    const filePath = `${output}/${constant}${String(frame).padStart(much, replacement)}.${extension[1]}`;
    const tempPath = `${output}/temp.${extension[1]}`;
    const screenshot = await page.screenshot({ path: tempPath, omitBackground: true });
    const currentScreenshot = PNG.sync.read(screenshot);

    if (!previousScreenshot) {
      const screenshot = await page.screenshot({ path: filePath, omitBackground: true });
      previousScreenshot = currentScreenshot;
      console.log(`[First] Frame ${frame} saved to ${filePath}`);
    }

    if (previousScreenshot) {
      const diff = new PNG({ width: currentScreenshot.width, height: currentScreenshot.height });
      const numDiffPixels = pixelmatch(previousScreenshot.data, currentScreenshot.data, diff.data, currentScreenshot.width, currentScreenshot.height, { threshold: 0.1 });
      
      if (numDiffPixels > 0) {
        const screenshot = await page.screenshot({ path: filePath, omitBackground: true  });
        console.log(`[UPDATING] Frame ${frame} saved to ${filePath}`);
        previousScreenshot = currentScreenshot;
      }
    }

    frame++;
  });

  await page.exposeFunction('stopAnimation', async () => {
    await browser.close();
  });

  const inputFilePath = input.startsWith("./")
  ? path.join(`/${__dirname}/`, input.substr(2))
  : input;


  console.log(inputFilePath, __dirname);
  await page.goto(`file://${inputFilePath}`);
};

module.exports = { captureSvgAnimation };
