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
        
        proxyList.splice(proxyIndex, 1);
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

    const proxyUrl = `http://${proxyConfig.proxyUsername}:${proxyConfig.proxyPassword}@${proxyConfig.proxyHost}:${proxyConfig.proxyPort}`;
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
        const response = await axios.get('https://ipapi.co/json/', {
            httpsAgent: agent,
            timeout: 10000
        });
        return { ...response.data, ...proxyConfig };
    } catch (error) {
        console.error('Error fetching proxy details from ipapi.co:', error.message);
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

const iPadModels = [
    "iPad5,1", "iPad5,2", "iPad5,3", "iPad5,4", "iPad6,3", "iPad6,4", "iPad6,7", "iPad6,8",
    "iPad6,11", "iPad6,12", "iPad7,1", "iPad7,2", "iPad7,3", "iPad7,4", "iPad7,5", "iPad7,6",
    "iPad7,11", "iPad7,12", "iPad8,1", "iPad8,2", "iPad8,3", "iPad8,4", "iPad8,5", "iPad8,6",
    "iPad8,7", "iPad8,8", "iPad8,9", "iPad8,10", "iPad8,11", "iPad8,12", "iPad11,1", "iPad11,2",
    "iPad11,3", "iPad11,4", "iPad11,6", "iPad11,7", "iPad12,1", "iPad12,2"
];

function getRandomModel(modelList) {
    return modelList[Math.floor(Math.random() * modelList.length)];
}

function generateFingerprint(proxyDetails) {
    const mobileDevices = [
        { name: "Android", os: "Android", browser: "Chrome" },
        { name: "iPhone", os: "iOS", browser: "Safari" },
        { name: "iPad", os: "iPadOS", browser: "Safari" }
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
        case 'iPad':
            const iPadOSVersion = (Math.floor(Math.random() * (16 - 13 + 1)) + 13).toFixed(1);
            const iPadModel = getRandomModel(iPadModels);
            userAgent = `Mozilla/5.0 (${iPadModel}; CPU OS ${iPadOSVersion.replace('.', '_')} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${iPadOSVersion} Mobile/15E148 Safari/604.1`;
            secChUa = `"Safari";v="${iPadOSVersion}", "Not;A=Brand";v="99"`;
            secChUaMobile = "?1";
            secChUaPlatform = "iPadOS";
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
        ],
        iPad: [
            { width: 768, height: 1024 },
            { width: 810, height: 1080 },
            { width: 834, height: 1112 },
            { width: 834, height: 1194 },
            { width: 1024, height: 1366 }
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
        doNotTrack: Math.random() > 0.5 ? "1" : "0",
        cookieEnabled: true,
        touchPoints: Math.floor(Math.random() * 5) + 1,
        maxTouchPoints: Math.floor(Math.random() * 5) + 1,
        secChUaPlatform
    };
}


async function launchBrowserWithProxy(proxyDetails) {
    if (!proxyDetails || !proxyDetails.proxyHost || !proxyDetails.proxyPort) {
        console.error('Invalid proxy configuration');
        return null;
    }

    const fingerprint = generateFingerprint(proxyDetails);
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_dev_profile-'));

    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        `--user-agent=${fingerprint.userAgent}`,
        `--lang=${fingerprint.language}`,
        '--disable-extensions',
        '--disable-default-apps',
        '--no-default-browser-check',
        '--no-first-run',
        `--proxy-server=${proxyDetails.proxyHost}:${proxyDetails.proxyPort}`,
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--deterministic-fetch',
        '--disable-features=IsolateOrigins,site-per-process',
        '--use-mobile-user-agent',
        '--enable-touch-events',
        '--enable-viewport'
    ];

    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: launchArgs,
            userDataDir: userDataDir,
            defaultViewport: {
                width: fingerprint.screenResolution.width,
                height: fingerprint.screenResolution.height,
                isMobile: true,
                hasTouch: true
            },
            ignoreHTTPSErrors: true,
            protocolTimeout: 300000,
        });

        const page = await browser.newPage();
        
        if (proxyDetails.proxyUsername && proxyDetails.proxyPassword) {
            await page.authenticate({
                username: "mmtools-zone-resi-region-us-session-58ba05a2175c-sessTime-5",
                password: "mmtools",
            });
        }

        await page.setExtraHTTPHeaders({
            'Sec-CH-UA': fingerprint.secChUa,
            'Sec-CH-UA-Mobile': fingerprint.secChUaMobile,
            'Sec-CH-UA-Platform': fingerprint.secChUaPlatform
        });

        await page.evaluateOnNewDocument((fp) => {
            // ... (keep the existing navigator and screen property definitions)
        }, fingerprint);

        return { browser, page, userDataDir };
    } catch (error) {
        console.error('Error launching browser:', error);
        return null;
    }
}

async function humanLikeScroll(page, direction) {
    await page.evaluate(async (direction) => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = Math.floor(Math.random() * 50) + 20;
            const maxHeight = document.body.scrollHeight;
            const scrollUp = () => window.scrollBy(0, -distance);
            const scrollDown = () => window.scrollBy(0, distance);

            const timer = setInterval(() => {
                if (direction === 'down') {
                    scrollDown();
                    totalHeight += distance;
                    if (totalHeight >= maxHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                } else if (direction === 'up') {
                    scrollUp();
                    if (window.scrollY === 0) {
                        clearInterval(timer);
                        resolve();
                    }
                }
            }, Math.floor(Math.random() * 300) + 200);
        });
    }, direction);
}

async function humanLikeDelay(min = 500, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
}

async function safeClick(page, selector, timeout = 10000) {
    await page.waitForSelector(selector, { timeout });
    const element = await page.$(selector);
    if (element) {
        await humanLikeDelay(500, 1500);
        await element.click().catch(e => console.error(`Error clicking element ${selector}:`, e));
    } else {
        console.error(`Element ${selector} not found`);
    }
}

async function handleBrowserInstance(proxyConfig, instanceNumber) {
    let browser, page, userDataDir;
    try {
        console.log(`Browser instance ${instanceNumber} starting...`);
        const proxyDetails = await retryOperation(() => getProxyDetails(proxyConfig));
        if (!proxyDetails) {
            console.error('Failed to get proxy details');
            return;
        }

        ({ browser, page, userDataDir } = await retryOperation(() => launchBrowserWithProxy(proxyDetails)));

        await retryOperation(() => clearBrowserData(page));
        await retryOperation(() => checkWebRTCLeak(page));

        console.log(`Browser instance ${instanceNumber}: Proxy Details:`, JSON.stringify(proxyDetails));

        await retryOperation(() => safeNavigate(page, "https://onlinembausa.exblog.jp/"));
        await humanLikeDelay(4000, 7000);
    
        if (!page.isClosed()) {
            await page.bringToFront();         
            const posts = [
                'a[href*="https://onlinembausa.exblog.jp/30815315/"]',
                'a[href*="https://onlinembausa.exblog.jp/30815308/"]',
                'a[href*="https://onlinembausa.exblog.jp/30815294/"]',
            ];
            
            await retryOperation(() => handlePosts(page, posts, 0));

            await humanLikeDelay(5000, 10000);
        }

        await retryOperation(() => clearBrowserData(page));

        console.log(`Browser instance ${instanceNumber} completed successfully.`);

    } catch (error) {
        console.error(`Error during browser instance ${instanceNumber} handling:`, error);
    } finally {
        if (browser) {
            try {
                await browser.close();
                console.log(`Browser instance ${instanceNumber} closed successfully.`);
            } catch (closeError) {
                console.error(`Error closing browser instance ${instanceNumber}:`, closeError);
            }
        }
        if (userDataDir) {
            try {
                fs.rmSync(userDataDir, { recursive: true, force: true });
                console.log(`User data directory for instance ${instanceNumber} removed.`);
            } catch (rmError) {
                console.error(`Error removing user data directory for instance ${instanceNumber}:`, rmError);
            }
        }
    }
}

async function handlePosts(page, posts, index) {
    if (index >= posts.length) return;

    const postSelector = posts[index];
    console.log(`Searching for post ${index + 1}...`);
    
    try {
        await page.waitForSelector(postSelector, { timeout: 10000 });
        
        if (await page.$(postSelector)) {
            await safeClick(page, postSelector);
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {});
            
            await humanLikeDelay(6000, 9000);
            console.log('Starting scrolling process...');
            await humanLikeScroll(page, 'down');
            console.log('Scrolling process completed');

            await humanLikeDelay(3000, 7000);
            console.log('Starting upward scrolling process...');
            await humanLikeScroll(page, 'up');
            console.log('Upward scrolling process completed');

            if (Math.random() < 0.3) {
                console.log('Simulating user reading...');
                await humanLikeDelay(10000, 20000);
            }

            await humanLikeDelay(5000, 10000);

            console.log('Navigating back to the previous page...');
            await page.goBack().catch(() => console.log('Error going back. Proceeding...'));
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }).catch(() => {});
        } else {
            console.log(`Post ${index + 1} not found. Skipping...`);
        }
    } catch (error) {
        console.error(`Error handling post ${index + 1}:`, error);
    }

    await handlePosts(page, posts, index + 1);
}

async function checkWebRTCLeak(page) {
    const webrtcStatus = await page.evaluate(() => {
        if (typeof RTCPeerConnection === 'function') {
            return "WebRTC is not fully disabled";
        }
        return "WebRTC is disabled";
    });
    console.log('WebRTC Status:', webrtcStatus);
}

async function clearBrowserData(page) {
    const client = await page.target().createCDPSession();

    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    await client.send('Storage.clearDataForOrigin', {
        origin: '*',
        storageTypes: 'all'
    });

    await page.evaluate(() => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            indexedDB.databases().then((databases) => {
                databases.forEach((db) => {
                    indexedDB.deleteDatabase(db.name);
                });
            });
            if (window.caches) {
                caches.keys().then(function(names) {
                    for (let name of names) caches.delete(name);
                });
            }
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                        registration.unregister();
                    }
                });
            }
        } catch (e) {
            console.log("Error while clearing storage:", e.message);
        }
    });
}

async function safeNavigate(page, url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await humanLikeDelay(5000, 10000);
        return;
      } catch (error) {
        console.warn(`Navigation failed (attempt ${i + 1}): ${error.message}`);
        if (i === maxRetries - 1) throw error;
        await humanLikeDelay(5000, 10000);
      }
    }
}

async function retryOperation(operation, maxRetries = 3, delay = 5000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            console.error(`Operation failed (attempt ${i + 1}):`, error.message);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function handleBrowserInstanceWithRetry(proxyConfig, instanceNumber, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await handleBrowserInstance(proxyConfig, instanceNumber);
            return;
        } catch (error) {
            console.error(`Browser instance ${instanceNumber} failed (attempt ${i + 1}):`, error);
            if (i === maxRetries - 1) {
                console.error(`All retries failed for browser instance ${instanceNumber}`);
            } else {
                await humanLikeDelay(10000, 20000);
            }
        }
    }
}

async function main() {
    while (true) {
        const proxies = [];
        for (let i = 0; i < 3; i++) {
            const proxy = await setupProxy();
            if (!proxy) {
                console.log('Not enough proxies available. Exiting...');
                return;
            }
            proxies.push(proxy);
        }

        console.log('Starting 3 browser instances simultaneously...');
        try {
            await Promise.all([
                handleBrowserInstanceWithRetry(proxies[0], 1),
                handleBrowserInstanceWithRetry(proxies[1], 2),
                handleBrowserInstanceWithRetry(proxies[2], 3)
            ]);
        } catch (error) {
            console.error('Error in one of the browser instances:', error);
        }

        console.log('All browser instances completed. Waiting before next round...');
        await humanLikeDelay(70000, 150000);
    }
}

main().catch(console.error);