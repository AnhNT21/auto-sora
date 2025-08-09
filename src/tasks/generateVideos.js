import { delay } from '../utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname equivalent
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

        await page.keyboard.type(prompt, { delay: 100 });

        await delay(1000, 2000);

        await page.keyboard.press('Enter');

        await page.waitForFunction(
            async (sel) => {
                const el = document.querySelector(sel);
                if (!el) return false;
                // Keep focus
                if (document.activeElement !== el) {
                    el.focus();
                }
                // If not blank, press Enter
                if (el.value.trim() !== '') {
                    const evt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
                    el.dispatchEvent(evt);
                }

                // End when blank
                return el.value.trim() === '';
            },
            { polling: 3000, timeout: 0 }, // timeout: 0 = no timeout
            'textarea[placeholder*="Describe your video..."]' // args
        );

        await delay(1000, 2000);

        return {
            success: true,
            message: 'Video generation initiated successfully',
        };
    } catch (error) {
        console.error('Error in generateVideos:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
