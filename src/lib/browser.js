import puppeteer from 'puppeteer';
import { configs } from '../configs/index.js';
import { getExecutable } from '../utils.js';

import { fileURLToPath } from 'url';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let browserPromise = null;
let videoGenHeaders = null;

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
        console.log('Browser opened');
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

    console.log('Page configured');
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
        console.log('Browser closed');
    }
};

const TARGET = 'https://sora.chatgpt.com/backend/video_gen';

function getHeader(obj, name) {
    if (!obj) return undefined;
    const n = name.toLowerCase();
    for (const [k, v] of Object.entries(obj)) if (k.toLowerCase() === n) return v;
    return undefined;
}

export const attachVideoGenLoggerCDP = async (page) => {
    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.enable');

    const reqs = new Map();

    const maybeSaves = (id) => {
        const r = reqs.get(id);
        if (!r || !r.request || !r.extra) return;
        const { request, extra } = r;
        if (request.method !== 'POST') return;
        if (!request.url.startsWith(TARGET)) return;

        const mergedHeaders = { ...(request.headers || {}), ...(extra.headers || {}) };

        const header = {
            'openai-sentinel-token': getHeader(mergedHeaders, 'openai-sentinel-token'),
            authorization: getHeader(mergedHeaders, 'authorization'),
            cookie: getHeader(mergedHeaders, 'cookie'),
            priority: getHeader(mergedHeaders, 'priority'),
        };

        if (!videoGenHeaders) {
            videoGenHeaders = header;
        }

        const filename = path.join(__dirname, '../configs/header.json');

        writeFileSync(filename, JSON.stringify({ header: videoGenHeaders, lastUpdate: new Date() }, null, 2), 'utf-8');

        reqs.delete(id);
    };

    cdp.on('Network.requestWillBeSent', (evt) => {
        const { requestId, request } = evt;
        const r = reqs.get(requestId) || {};
        r.request = request; // JS-visible headers + initialPriority/fetchPriority
        reqs.set(requestId, r);
        maybeSaves(requestId);
    });

    cdp.on('Network.requestWillBeSentExtraInfo', (evt) => {
        const { requestId, headers } = evt; // browser-attached headers (Cookie, etc.)
        const r = reqs.get(requestId) || {};
        r.extra = { headers };
        reqs.set(requestId, r);
        maybeSaves(requestId);
    });

    return () => {
        cdp.removeAllListeners();
    };
};

export const getVideoGenHeaders = async () => {
    if (!videoGenHeaders) {
        // console.log('Video Gen headers not set. Please run attachVideoGenconsole.loggerCDP first.');
        console.log('Reading videoGenHeaders from file...');
        const data = JSON.parse(readFileSync(path.join(__dirname, '../configs/header.json')));

        if (Object.keys(data).length === 0) {
            console.log('No videoGenHeaders found in file.');
            videoGenHeaders = null;
        } else {
            const token = JSON.stringify(data.header['openai-sentinel-token']).slice(1, -1); // Remove quotes from the string

            videoGenHeaders = {
                ...data.header,
                'openai-sentinel-token': token,
            };
        }
        // console.log('Video Gen headers loaded:', videoGenHeaders);
        return videoGenHeaders;
    } else {
        return videoGenHeaders;
    }
};

export const resetVideoGenHeaders = () => {
    writeFileSync(path.join(__dirname, '../configs/header.json'), '{}', null, 2), 'utf-8';
    videoGenHeaders = null;
};
