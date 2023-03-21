const { captureSvgAnimation } = require('./capture_svg_animation.js');

async function captureAnimation() {
  const options = {
    input: './src/index.html?frame=1&seconds=180',
    width: '800',
    height: '800',
    start: '1',
    end: '280',
    output: './artifacts',
    naming: 'output%05d.png',
  };

  try {
    await captureSvgAnimation(options);
    console.log('Processing animations');
  } catch (error) {
    console.error('Error capturing animation:', error);
  }
}

captureAnimation();