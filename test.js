const puppeteer = require('puppeteer');
const axios = require('axios');
const crypto = require('crypto');

const proxyConfig = {
  proxyHost: 'na.e433vmz1.lunaproxy.net',
  proxyPort: '12233',
  proxyUsername: 'user-lu2659880-region-us-st-california',
  proxyPassword: '7808147373Yk*#@',
  proxyProtocol: 'http'
};

async function getProxyDetails() {
  try {
    const response = await axios.get('https://ipapi.co/json/', {
      proxy: {
        host: proxyConfig.proxyHost,
        port: proxyConfig.proxyPort,
        auth: {
          username: proxyConfig.proxyUsername,
          password: proxyConfig.proxyPassword
        },
        protocol: proxyConfig.proxyProtocol
      },
      timeout: 30000 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proxy details:', error.message);
    return {};
  }
}

function getRandomUserAgent() {
  // Implement a function to return a random user agent
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
}

function getRandomDevice() {
  // Implement a function to return a random device configuration
  return {
    os: 'Windows',
    browser: 'Chrome',
    resolution: '1920x1080'
  };
}

async function configureBrowser(proxyDetails) {
  const userAgent = getRandomUserAgent();
  const selectedDevice = getRandomDevice();
  const selectedResolution = selectedDevice.resolution.split('x').map(Number);

  return {
    userAgent,
    language: proxyDetails?.language || ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN', 'ru-RU'][Math.floor(Math.random() * 10)],
    hardwareConcurrency: Math.floor(Math.random() * 6) + 2,
    deviceMemory: [2, 4, 6, 8][Math.floor(Math.random() * 4)],
    screenResolution: selectedResolution,
    colorDepth: 24,
    timezone: proxyDetails?.timezone || 'UTC',
    platform: selectedDevice.os,
    plugins: [],
    fonts: ["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman", "Courier", "Palatino", "Garamond", "Bookman", "Comic Sans MS", "Trebuchet MS", "Arial Black"],
    canvasData: crypto.randomBytes(16).toString('hex'),
    browser: selectedDevice.browser,
    os: selectedDevice.os,
    geolocation: {
      latitude: proxyDetails?.latitude || (Math.random() * 180 - 90),
      longitude: proxyDetails?.longitude || (Math.random() * 360 - 180)
    },
    doNotTrack: Math.random() > 0.5 ? "1" : "0",
    cookieEnabled: true,
    touchPoints: Math.floor(Math.random() * 5) + 1,
    maxTouchPoints: Math.floor(Math.random() * 5) + 1,
  };
}

async function runBrowser() {
  const proxyDetails = await getProxyDetails();
  console.log(proxyDetails)
  const browserConfig = await configureBrowser(proxyDetails);

  const browser = await puppeteer.launch({
    args: [
      `--proxy-server=${proxyConfig.proxyHost}:${proxyConfig.proxyPort}`,
      `--user-agent=${browserConfig.userAgent}`,
      `--lang=${browserConfig.language}`,
    ],
    defaultViewport: {
      width: browserConfig.screenResolution[0],
      height: browserConfig.screenResolution[1],
    },
  });

  const page = await browser.newPage();

  // Set up authentication for the proxy
  await page.authenticate({
    username: proxyConfig.proxyUsername,
    password: proxyConfig.proxyPassword,
  });

  // Configure the page with the browser settings
  await page.evaluateOnNewDocument((config) => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => config.hardwareConcurrency });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => config.deviceMemory });
    Object.defineProperty(screen, 'colorDepth', { get: () => config.colorDepth });
    Object.defineProperty(navigator, 'platform', { get: () => config.platform });
    Object.defineProperty(navigator, 'plugins', { get: () => config.plugins });
    Object.defineProperty(navigator, 'languages', { get: () => [config.language] });
    Object.defineProperty(navigator, 'doNotTrack', { get: () => config.doNotTrack });
    Object.defineProperty(navigator, 'cookieEnabled', { get: () => config.cookieEnabled });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => config.maxTouchPoints });
  }, browserConfig);

  // Your automation code goes here
  // For example:
  // await page.goto('https://example.com');
  // await page.screenshot({ path: 'example.png' });

  // await browser.close();
}

runBrowser().catch(console.error);