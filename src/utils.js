import fs from 'fs';
import { configs } from './configs/index.js';

export const getExecutable = () => {
    const os = process.platform;
    switch (os) {
        case 'darwin':
            return configs.BROWSER.DARWIN_EXECUTABLE_PATH || '';

        case 'win32':
            return configs.BROWSER.WIN_EXECUTABLE_PATH || '';

        default:
            return null;
    }
};

export const delay = (min, max) => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

export const saveToFile = (filename, data) => {
    fs.writeFileSync('./data/' + filename, JSON.stringify(data, null, 2), 'utf8');
};

export const log = (msg, type) => {
    if (configs.SERVER_LOGS === false) return;

    switch (type) {
        case 'error':
            console.error('[X]', msg);
            break;
        case 'warning':
            console.warn('[!]', msg);
            break;
        default:
            console.log('[*]', msg);
            break;
    }
};
