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
const proxyConfig = {
    proxyHost: 'na.e433vmz1.lunaproxy.net',
    proxyPort: '12233',
    proxyUsername: 'user-lu2659880-region-us-st-california',
    proxyPassword: '7808147373Yk*#@',
    proxyProtocol: 'http'
  };
async function setupProxy() {
    return {
        proxyHost: proxyConfig.proxyHost,
        proxyPort: proxyConfig.proxyPort,
        proxyUsername: proxyConfig.proxyUsername,
        proxyPassword: proxyConfig.proxyPassword,
        proxyProtocol: proxyConfig.proxyProtocol
    };
}

async function getProxyDetails(proxyConfig) {
    // if (!proxyConfig || !proxyConfig.proxyHost || !proxyConfig.proxyPort || !proxyConfig.proxyUsername || !proxyConfig.proxyPassword) {
    //     console.error('Invalid proxy configuration');
    //     return null;
    // }

    // const proxyUrl = `http://${proxyConfig.proxyUsername}:${proxyConfig.proxyPassword}@${proxyConfig.proxyHost}:${proxyConfig.proxyPort}`;
    // const agent = new HttpsProxyAgent(proxyUrl);
    const encodedUsername = encodeURIComponent(proxyConfig.proxyUsername);
    const encodedPassword = encodeURIComponent(proxyConfig.proxyPassword);
    const proxyUrl = `${proxyConfig.proxyProtocol}://${encodedUsername}:${encodedPassword}@${proxyConfig.proxyHost}:${proxyConfig.proxyPort}`;
    
    const httpsAgent = new HttpsProxyAgent(proxyUrl);

    try {
        const response = await axios.get('https://ipapi.co/json/', {
            httpsAgent,
            timeout: 15000
          }
    
    );
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

function generateFingerprint(proxyDetails) {
    const browsers = [
        { name: "firefox", minVersion: 90, maxVersion: 115 },
        { name: "chrome", minVersion: 88, maxVersion: 115 },
        { name: "safari", minVersion: 15, maxVersion: 16 }
    ];
    
    const operatingSystems = ['Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64'];
    
    function getRandomVersion(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    const selectedBrowser = browsers[Math.floor(Math.random() * browsers.length)];
    const selectedOS = operatingSystems[Math.floor(Math.random() * operatingSystems.length)];
    const version = getRandomVersion(selectedBrowser.minVersion, selectedBrowser.maxVersion);
    
    let userAgent, secChUa, secChUaMobile, secChUaPlatform;
    
    switch (selectedBrowser.name) {
        case 'firefox':
            userAgent = `Mozilla/5.0 (${selectedOS}; rv:${version}.0) Gecko/20100101 Firefox/${version}.0`;
            secChUa = `"Firefox";v="${version}", "Not;A=Brand";v="99"`;
            secChUaMobile = '?0';
            secChUaPlatform = selectedOS.includes('Windows') ? 'Windows' : selectedOS.includes('Macintosh') ? 'macOS' : 'Linux';
            break;
        case 'chrome':
            userAgent = `Mozilla/5.0 (${selectedOS}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.${Math.floor(Math.random() * 1000 + 4324)}.${Math.floor(Math.random() * 100 + 150)} Safari/537.36`;
            secChUa = `"Google Chrome";v="${version}", "Chromium";v="${version}", "Not;A=Brand";v="99"`;
            secChUaMobile = '?0';
            secChUaPlatform = selectedOS.includes('Windows') ? 'Windows' : selectedOS.includes('Macintosh') ? 'macOS' : 'Linux';
            break;
        case 'safari':
            userAgent = `Mozilla/5.0 (${selectedOS}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`;
            secChUa = `"Safari";v="${version}", "Not;A=Brand";v="99"`;
            secChUaMobile = '?0';
            secChUaPlatform = selectedOS.includes('Windows') ? 'Windows' : selectedOS.includes('Macintosh') ? 'macOS' : 'Linux';
            break;
    }

    const platform = selectedOS.includes('Windows') ? 'Win32' : selectedOS.includes('Mac') ? 'MacIntel' : 'Linux x86_64';
    
    const plugins = [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" },
        { name: "Native Client", filename: "internal-nacl-plugin" }
    ];
    const fonts = [
        "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Palatino", "Garamond", "Bookman", "Comic Sans MS", "Trebuchet MS", "Arial Black", "Impact"
    ];

    return {
        userAgent,
        secChUa,
        language: proxyDetails?.language || ['en-US', 'en'][Math.floor(Math.random() * 2)],
        hardwareConcurrency: Math.floor(Math.random() * 8) + 2,
        deviceMemory: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
        screenResolution: { width: 1920, height: 1080 },
        colorDepth: 24,
        timezone: proxyDetails?.timezone || 'UTC',
        platform,
        plugins: plugins.slice(0, Math.floor(Math.random() * plugins.length) + 1),
        fonts: fonts.slice(0, Math.floor(Math.random() * fonts.length) + 1),
        canvasData: crypto.randomBytes(16).toString('hex'),
        browser: selectedBrowser.name,
        os: selectedOS,
        geolocation: {
            latitude: proxyDetails?.latitude || (Math.random() * 180 - 90),
            longitude: proxyDetails?.longitude || (Math.random() * 360 - 180)
        },
        doNotTrack: Math.random() > 0.5 ? "1" : "0",
        cookieEnabled: true,
        touchPoints: Math.floor(Math.random() * 5),
        productSub: "20030107",
        maxTouchPoints: Math.floor(Math.random() * 5),
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
        '--disable-features=IsolateOrigins,site-per-process'
    ];

    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: launchArgs,
            userDataDir: userDataDir,
            defaultViewport: null,
            ignoreHTTPSErrors: true,
            protocolTimeout: 280000,
        });

        const page = await browser.newPage();
        
        if (proxyDetails.proxyUsername && proxyDetails.proxyPassword) {
            await page.authenticate({
                username: "user-lu2659880-region-us-st-california",
                password: "7808147373Yk*#@",
            });
        }

        await page.setExtraHTTPHeaders({
            'Sec-CH-UA': fingerprint.secChUa
        });

        await page.evaluateOnNewDocument((fp) => {
            const navigatorProps = {
                hardwareConcurrency: fp.hardwareConcurrency,
                deviceMemory: fp.deviceMemory,
                userAgent: fp.userAgent,
                language: fp.language,
                languages: [fp.language],
                platform: fp.platform,
                plugins: fp.plugins,
                doNotTrack: fp.doNotTrack,
                cookieEnabled: fp.cookieEnabled,
                productSub: fp.productSub,
                maxTouchPoints: fp.maxTouchPoints,
                webdriver: undefined
            };

            for (const [key, value] of Object.entries(navigatorProps)) {
                Object.defineProperty(navigator, key, { get: () => value });
            }

            Object.defineProperty(screen, 'width', { get: () => fp.screenResolution.width });
            Object.defineProperty(screen, 'height', { get: () => fp.screenResolution.height });
            Object.defineProperty(screen, 'colorDepth', { get: () => fp.colorDepth });

            Object.defineProperty(Intl, 'DateTimeFormat', {
                get: () => function (...args) {
                    return {
                        resolvedOptions: () => ({
                            locale: fp.language,
                            timeZone: fp.timezone,
                        })
                    };
                }
            });

            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function (type) {
                if (type === 'image/png' && this.width === 16 && this.height === 16) {
                    return 'data:image/png;base64,' + fp.canvasData;
                }
                return originalToDataURL.apply(this, arguments);
            };

            const fakeGeo = {
                latitude: fp.geolocation.latitude,
                longitude: fp.geolocation.longitude,
                accuracy: 100
            };
            navigator.geolocation.getCurrentPosition = function (cb) {
                cb({ coords: fakeGeo });
            };
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
            const distance = Math.floor(Math.random() * 50) + 20; // Smaller distance for slower scroll
            const maxHeight = document.body.scrollHeight;
            const scrollUp = () => window.scrollBy(0, -distance);
            const scrollDown = () => window.scrollBy(0, distance);

            const timer = setInterval(() => {
                if (direction === 'down') {
                    scrollDown();
                    totalHeight += distance;
                    console.log(`Scrolling down. Total scrolled: ${totalHeight}, Max height: ${maxHeight}`);
                    if (totalHeight >= maxHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                } else if (direction === 'up') {
                    scrollUp();
                    totalHeight -= distance;
                    console.log(`Scrolling up. Total scrolled: ${totalHeight}`);
                    if (window.scrollY === 0) {
                        clearInterval(timer);
                        resolve();
                    }
                }
            }, Math.floor(Math.random() * 300) + 200); // Larger interval for slower scroll
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
        await humanLikeDelay(500, 1500); // Small delay before clicking
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

        await retryOperation(() => safeNavigate(page, "https://cyberinsuranceguide.exblog.jp/"));
        await humanLikeDelay(4000, 7000);
    
        if (!page.isClosed()) {
            await page.bringToFront();         
            const posts = [
                'a[href*="https://cyberinsuranceguide.exblog.jp/32667330/"]',
                'a[href*="https://cyberinsuranceguide.exblog.jp/32665404/"]',
                'a[href*="https://cyberinsuranceguide.exblog.jp/32665297/"]',
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
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 70000 }).catch(() => {});
        } else {
            console.log(`Post ${index + 1} not found. Skipping...`);
        }
    } catch (error) {
        console.error(`Error handling post ${index + 1}:`, error);
    }

    // Recursively handle the next post
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
// async function watchGoogleAds(page) {
//     // Implement your Google Ads watching logic here
//     // For example:
//     await page.goto('https://www.google.com', { waitUntil: 'networkidle0' });
//     await humanLikeDelay(3000, 5000);


    
//     await humanLikeDelay(10000, 15000);
//     ;
//             await checkWebRTCLeak(page);
//             await clearBrowserData(page);

// }


async function clearBrowserData(page) {
    const client = await page.target().createCDPSession();

    // Clear cookies, cache, and storage
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    await client.send('Storage.clearDataForOrigin', {
        origin: '*',
        storageTypes: 'all'
    });

    // Clear localStorage, sessionStorage, IndexedDB, WebSQL, and service workers
    await page.evaluate(() => {
        try {
            localStorage.clear();
        } catch (e) {
            console.log("Unable to clear localStorage");
        }
        try {
            sessionStorage.clear();
        } catch (e) {
            console.log("Unable to clear sessionStorage");
        }
        indexedDB.databases().then((databases) => {
            databases.forEach((db) => {
                indexedDB.deleteDatabase(db.name);
            });
        }).catch(e => console.log("Error clearing IndexedDB:", e.message));
        if (window.caches) {
            caches.keys().then(function(names) {
                for (let name of names) caches.delete(name);
            }).catch(e => console.log("Error clearing caches:", e.message));
        }
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister().catch(e => console.log("Error unregistering service worker:", e.message));
                }
            }).catch(e => console.log("Error clearing service workers:", e.message));
        }
    }).catch(e => console.log("Error while clearing storage:", e.message));
}


async function safeNavigate(page, url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await humanLikeDelay(5000, 10000);
        return;
      } catch (error) {
        if (error.name === 'TimeoutError') {
          console.warn(`Navigation timeout (attempt ${i + 1}): ${error.message}`);
        } else {
          console.error(`Navigation failed (attempt ${i + 1}): ${error.message}`);
        }
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
            return; // If successful, exit the function
        } catch (error) {
            console.error(`Browser instance ${instanceNumber} failed (attempt ${i + 1}):`, error);
            if (i === maxRetries - 1) {
                console.error(`All retries failed for browser instance ${instanceNumber}`);
            } else {
                await humanLikeDelay(10000, 20000); // Wait before retrying
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
        await humanLikeDelay(70000, 150000); // Wait 70 sec to 2.5 minutes before next round
    }
}
main().catch(console.error);