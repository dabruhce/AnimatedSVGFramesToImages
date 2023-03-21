// Import required dependencies
const puppeteer = require('puppeteer');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// Initialize a variable to hold the previous screenshot for comparison
let previousScreenshot = null;

// Function to capture SVG animation using Puppeteer
const captureSvgAnimation = async (options) => {
  // Destructure options object
  const { input, width, height, start, end, output, naming } = options;

  // Launch Puppeteer browser with specified viewport dimensions
  const browser = await puppeteer.launch({
    defaultViewport: { width: parseInt(width), height: parseInt(height) },
  });

  // Create a new page in the browser
  const page = await browser.newPage();
  // Initialize frame counter with the start value
  let frame = parseInt(start);

  // Expose a function to take a screenshot of the animation for each frame
  await page.exposeFunction('takeFrame', async () => {
    // If the frame counter reaches the end value, close the browser and return
    if (frame === parseInt(end)) {
      await browser.close();
      return;
    }

    // Parse the naming pattern for output files
    const [constant, ...namingParts] = naming.split('%');
    const [replacement, much] = namingParts[0];
    const extension = namingParts[0].split('.');

    // Generate file paths for the current frame and a temporary file
    const filePath = `${output}/${constant}${String(frame).padStart(much, replacement)}.${extension[1]}`;
    const tempPath = `${output}/temp.${extension[1]}`;

    // Capture a screenshot and save it to the temporary file
    const screenshot = await page.screenshot({ path: tempPath, omitBackground: true });
    // Read the screenshot data
    const currentScreenshot = PNG.sync.read(screenshot);

    // If there's no previous screenshot or there's a difference between the two,
    // save the current screenshot and update the previous screenshot
    if (!previousScreenshot || hasDifference(previousScreenshot, currentScreenshot)) {
      await page.screenshot({ path: filePath, omitBackground: true });
      console.log(`[UPDATED] Frame ${frame} saved to ${filePath}`);
      previousScreenshot = currentScreenshot;
    }

    // Increment the frame counter
    frame++;
  });

  // Expose a function to stop the animation and close the browser
  await page.exposeFunction('stopAnimation', async () => {
    await browser.close();
  });

  // Generate the input file path
  const inputFilePath = input.startsWith('./')
    ? path.join(`/${__dirname}/`, input.substr(2))
    : input;

  // Log the input file path and the script's directory
  console.log(inputFilePath, __dirname);
  // Navigate to the input file URL
  await page.goto(`file://${inputFilePath}`);
};

// Function to check if there's a difference between two images
function hasDifference(img1, img2) {
  const diff = new PNG({ width: img1.width, height: img1.height });
  const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });
  return numDiffPixels > 0;
}

// Export the captureSvgAnimation function
module.exports = { captureSvgAnimation };
