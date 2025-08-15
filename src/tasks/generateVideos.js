import path from 'path';
import { delay } from '../utils.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateVideos = async (page, prompt, ref_img) => {
    try {
        await page.goto(`https://sora.chatgpt.com/library`, { waitUntil: 'networkidle2' });

        // Find textarea with placeholder containing "Describe your video..."
        const textarea = await page.waitForSelector('textarea[placeholder*="Describe your video..."]', { visible: true });
        if (!textarea) {
            const textareaImg = await page.waitForSelector('textarea[placeholder*="Describe your image..."]', { visible: true });
            if (textareaImg) {
            } else {
                throw new Error('No suitable textarea found for video description.');
            }
        }

        // Focus on it
        await textarea.focus();

        if (ref_img) {
            const fileInput = await page.$('input[type="file"]');
            if (!fileInput) {
                throw new Error('File input for reference image not found.');
            }
            const filePath = path.resolve(__dirname, `../../inputs/images/${ref_img}`); // Assuming ref_img is a valid file path
            await fileInput.uploadFile(filePath);
            await delay(1000, 2000); // Wait for the image to upload
            console.log(`Reference image uploaded: ${filePath}`);
        }

        // Clear any existing text
        await page.evaluate((selector) => {
            const el = document.querySelector(selector);
            if (el) el.value = '';
        }, 'textarea[placeholder*="Describe your video..."]');

        await page.keyboard.type(prompt, { delay: 10 });

        await delay(1000, 2000);

        await page.keyboard.press('Enter');

        await page.waitForFunction(
            () => el.value.trim() === '',
            'textarea[placeholder*="Describe your video..."]' // args
        );

        const taskId = await page.$eval('a.group\\/tile.relative.h-full.w-full', (el) => el.getAttribute('href').split('/t/')[1]);

        return taskId;
    } catch (error) {
        console.error('Error in generateVideos:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};

export const getTokens = async (page) => {
    try {
        console.log('🚀 Starting token generation...');
        await page.goto(`https://sora.chatgpt.com/library`, { waitUntil: 'networkidle2' });
        console.log('Opening Sora library page...');

        // Find textarea with placeholder containing "Describe your video..."
        const textarea = await page.waitForSelector('textarea[placeholder*="Describe your video..."]', { visible: true });
        if (!textarea) {
            const textareaImg = await page.waitForSelector('textarea[placeholder*="Describe your image..."]', { visible: true });
            if (textareaImg) {
            } else {
                throw new Error('No suitable textarea found for video description.');
            }
        }

        // Focus on it
        await textarea.focus();

        // Clear any existing text
        await page.evaluate((selector) => {
            const el = document.querySelector(selector);
            if (el) el.value = '';
        }, 'textarea[placeholder*="Describe your video..."]');

        await page.keyboard.type('a', { delay: 10 });
        console.log('Typing prompt to trigger token generation...');

        await delay(1000, 2000);

        console.log('Submiting prompt...');
        await page.keyboard.press('Enter');
        await page.waitForFunction(
            () => {
                const el = document.querySelector('textarea[placeholder*="Describe your video..."]');
                return el && el.value.trim() === '';
            },
            { polling: 'mutation' }
        );
        console.log('Prompt submitted, waiting for token generation...');
        await delay(3000, 5000);
        await page.click("xpath///div[span[text()='Activity']]/div");
        await delay(1000, 1000);
        await page.waitForSelector('a[href*="task_"]', { timeout: 60000 });
        await page.hover('a[href*="task_"]');
        await delay(1000, 1000);
        await page.waitForSelector("xpath///a[contains(@href,'task_')]//button", { timeout: 60000 });
        // await page.click("xpath///a[contains(@href,'task_')]//button");
        await page.evaluate(() => document.querySelector('a[href*="task_"] button').click());
        console.log('Clicking Cancel button to stop Video generation...');
        await delay(1000, 2000);
        await page.click("xpath///button[text()='Confirm']");
        await delay(3000, 5000);
        console.log('Tokens generated successfully, closing browser...');

        return true;
    } catch (error) {
        console.error('Error in getToken:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
