const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { HttpsProxyAgent } = require('https-proxy-agent');
const axios = require('axios');
const os = require('os');
const crypto = require('crypto');
const fss = require('fs').promises;
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function setupProxy() {
    try {
        let data = await fss.readFile('100p.txt', 'utf8');
        let proxyList = data.split('\n').filter(line => line.trim() !== '');
        if (proxyList.length === 0) {
            console.log('No proxies available');
            return null;
        }
        const proxyIndex = Math.floor(Math.random() * proxyList.length);
        const proxy = proxyList[proxyIndex];
        const [proxyHost, proxyPort, proxyUsername, proxyPassword] = proxy.split(':');

        // Remove only the used proxy from the list
        proxyList.splice(proxyIndex, 1);

        // Write the updated list back to the file
        await fss.writeFile('100p.txt', proxyList.join('\n'));

        await humanLikeDelay(5000, 10000);
        return { proxyHost, proxyPort, proxyUsername, proxyPassword };
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function getProxyDetails(proxyConfig) {
    if (!proxyConfig || !proxyConfig.proxyHost || !proxyConfig.proxyPort || !proxyConfig.proxyUsername || !proxyConfig.proxyPassword) {
        console.error('Invalid proxy configuration');
        return null;
    }
    const proxyHost = "47a2a141dc30e051.iuy.us.ip2world.vip"
    const proxyPort = "6001"
    const proxyUrl = `http://na.e433vmz1.lunaproxy.net:12233`;
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
        const response = await axios.get('https://ipapi.co/json/', {
            httpsAgent: agent,
            timeout: 10000
        });
        return { ...response.data, ...proxyConfig };
    } catch (error) {
        console.error('Error fetching proxy details from ipapi.co:', error.message);
        // Fallback to a different service
        try {
            const fallbackResponse = await axios.get('https://api.ipify.org?format=json', {
                httpsAgent: agent,
                timeout: 10000
            });
            return { ...fallbackResponse.data, ...proxyConfig };
        } catch (fallbackError) {
            console.error('Error fetching proxy details from fallback service:', fallbackError.message);
            return null;
        }
    }
}

const androidModels = [
    "SM-G950F", "SM-G955F", "SM-G960F", "SM-G965F", "SM-G970F", "SM-G973F", "SM-G975F",
    "SM-G980F", "SM-G985F", "SM-G988B", "SM-G991B", "SM-G996B", "SM-G998B", "SM-G991U1",
    "SM-G996U1", "SM-G998U1", "SM-A515F", "SM-A715F", "SM-A217F", "SM-A307FN", "SM-A515U1",
    "SM-A716U1", "SM-A217M", "Pixel 4", "Pixel 4 XL", "Pixel 5", "Pixel 5a", "Pixel 6",
    "Pixel 6 Pro", "Pixel 6a", "Pixel 7", "Pixel 7 Pro", "Pixel 7a", "OnePlus 9",
    "OnePlus 9 Pro", "OnePlus 9R", "OnePlus 8", "OnePlus 8 Pro", "OnePlus 8T",
    "OnePlus Nord", "OnePlus Nord 2", "OnePlus Nord CE"
];

const iPhoneModels = [
    "iPhone8,1", "iPhone8,2", "iPhone8,4", "iPhone9,1", "iPhone9,2", "iPhone9,3", "iPhone9,4",
    "iPhone10,1", "iPhone10,2", "iPhone10,3", "iPhone10,4", "iPhone10,5", "iPhone10,6",
    "iPhone11,2", "iPhone11,4", "iPhone11,6", "iPhone11,8", "iPhone12,1", "iPhone12,3",
    "iPhone12,5", "iPhone12,8", "iPhone13,1", "iPhone13,2", "iPhone13,3", "iPhone13,4",
    "iPhone14,2", "iPhone14,3", "iPhone14,4", "iPhone14,5"
];

function getRandomModel(modelList) {
    return modelList[Math.floor(Math.random() * modelList.length)];
}

function generateFingerprint(proxyDetails) {
    const mobileDevices = [
        { name: "Android", os: "Android", browser: "Chrome" },
        { name: "iPhone", os: "iOS", browser: "Safari" }
    ];

    const selectedDevice = mobileDevices[Math.floor(Math.random() * mobileDevices.length)];
    let userAgent, secChUa, secChUaMobile, secChUaPlatform;

    switch (selectedDevice.name) {
        case 'Android':
            const androidVersion = Math.floor(Math.random() * (13 - 8 + 1)) + 8;
            const chromeVersion = Math.floor(Math.random() * (115 - 88 + 1)) + 88;
            const androidModel = getRandomModel(androidModels);
            userAgent = `Mozilla/5.0 (Linux; Android ${androidVersion}; ${androidModel}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Mobile Safari/537.36`;
            secChUa = `"Google Chrome";v="${chromeVersion}", "Chromium";v="${chromeVersion}", "Not;A=Brand";v="99"`;
            secChUaMobile = "?1";
            secChUaPlatform = "Android";
            break;
        case 'iPhone':
            const iOSVersion = (Math.floor(Math.random() * (16 - 13 + 1)) + 13).toFixed(1);
            const iPhoneModel = getRandomModel(iPhoneModels);
            userAgent = `Mozilla/5.0 (${iPhoneModel}; CPU iPhone OS ${iOSVersion.replace('.', '_')} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${iOSVersion} Mobile/15E148 Safari/604.1`;
            secChUa = `"Safari";v="${iOSVersion}", "Not;A=Brand";v="99"`;
            secChUaMobile = "?1";
            secChUaPlatform = "iOS";
            break;
    }

    const screenResolutions = {
        Android: [
            { width: 360, height: 640 },
            { width: 360, height: 720 },
            { width: 360, height: 740 },
            { width: 412, height: 915 },
            { width: 412, height: 732 },
            { width: 390, height: 844 },
            { width: 393, height: 851 }
        ],
        iPhone: [
            { width: 375, height: 667 },
            { width: 414, height: 736 },
            { width: 375, height: 812 },
            { width: 414, height: 896 },
            { width: 390, height: 844 },
            { width: 428, height: 926 }
        ]
    };

    const selectedResolution = screenResolutions[selectedDevice.name][Math.floor(Math.random() * screenResolutions[selectedDevice.name].length)];

    return {
        userAgent,
        secChUa,
        secChUaMobile,
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
        doNotTrack: Math.random() > 0.5,
        secChUaPlatform
    };
}

function convertFingerprintToHeaders(fingerprint) {
    return {
        'User-Agent': fingerprint.userAgent,
        'Accept-Language': fingerprint.language,
        'Device-Memory': fingerprint.deviceMemory,
        'DNT': fingerprint.doNotTrack ? '1' : '0',
        'Viewport-Width': fingerprint.screenResolution.width,
        'Sec-CH-UA': fingerprint.secChUa,
        'Sec-CH-UA-Mobile': fingerprint.secChUaMobile,
        'Sec-CH-UA-Platform': fingerprint.secChUaPlatform
    };
}

async function setupBrowserContext(proxyDetails, fingerprint) {
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--proxy-server=http://${proxyDetails.proxyHost}:${proxyDetails.proxyPort}`,
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-extensions',
        '--start-maximized',
        '--user-agent=' + fingerprint.userAgent,
    ];

    if (proxyDetails.proxyUsername && proxyDetails.proxyPassword) {
        args.push(`--proxy-auth=${proxyDetails.proxyUsername}:${proxyDetails.proxyPassword}`);
    }

    const browser = await puppeteer.launch({
        headless: false,
        args: args,
        ignoreHTTPSErrors: true,
        defaultViewport: null
    });

    const [page] = await browser.pages();
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    await page.authenticate({
        username: proxyDetails.proxyUsername,
        password: proxyDetails.proxyPassword
    });

    await page.setExtraHTTPHeaders(convertFingerprintToHeaders(fingerprint));

    return { browser, page };
}

async function takeScreenshot(page, url) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        const screenshotPath = `screenshots/${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);
    } catch (error) {
        console.error(`Error taking screenshot: ${error.message}`);
    }
}

async function humanLikeDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

(async () => {
    if (!fs.existsSync('screenshots')) {
        fs.mkdirSync('screenshots');
    }

    const proxyDetails = await setupProxy();
    if (!proxyDetails) {
        console.error('Failed to set up proxy. Exiting...');
        return;
    }

    const completeProxyDetails = await getProxyDetails(proxyDetails);
    if (!completeProxyDetails) {
        console.error('Failed to fetch proxy details. Exiting...');
        return;
    }

    const fingerprint = generateFingerprint(completeProxyDetails);

    const { browser, page } = await setupBrowserContext(completeProxyDetails, fingerprint);
    await takeScreenshot(page, 'https://www.google.com');
    await humanLikeDelay(40000, 40000);

    await takeScreenshot(page, 'https://www.example.com');

    await browser.close();
})();
