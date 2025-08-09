import puppeteer from 'puppeteer';
import { configs } from '../configs/index.js';
import { getExecutable, log } from '../utils.js';

let browserPromise = null;

export const openBrowser = async (headless = configs.BROWSER.HEADLESS) => {
    if (!browserPromise) {
        const executablePath = getExecutable();
        if (!executablePath) {
            throw new Error('Browser executable not found for this platform');
        }

        browserPromise = puppeteer.launch({
            headless,
            defaultViewport: null,
            ignoreDefaultArgs: ['--enable-automation'],
            executablePath,
            args: [`--user-data-dir=${configs.BROWSER.CHROME_PROFILE_PATH}`, ...configs.BROWSER.ARGS],
        });
        log('Browser opened');
        return browserPromise;
    }
    return browserPromise;
};

export const configurePage = async (page) => {
    await page.setUserAgent(configs.BROWSER.USER_AGENT);
    await page.setExtraHTTPHeaders(configs.BROWSER.HEADER);

    await page.evaluateOnNewDocument(() => {
        (() => {
            const style = document.createElement('style');
            style.innerHTML = `
                * { 
                    animation: none !important; 
                    transition: none !important; 
                }
            `;
            document.head.appendChild(style);
        })();
    });

    log('Page configured');
    return page;
};

export const newPage = async () => {
    const browser = await openBrowser();
    const page = await browser.newPage();
    await configurePage(page);
    return page;
};

export const closeBrowser = async () => {
    if (browserPromise) {
        const browser = await browserPromise;
        await browser.close();
        browserPromise = null;
    }
};
