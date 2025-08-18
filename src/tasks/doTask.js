import path from 'path';
import XLSX from 'xlsx';
import { delay } from '../utils.js';
import { getTokens } from './generateVideos.js';
import { fileURLToPath } from 'url';
import { generateVideoAPI } from './generateVideoAPI.js';
import { attachVideoGenLoggerCDP, closeBrowser, configurePage, getVideoGenHeaders, openBrowser } from '../lib/browser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const doTask = async () => {
    try {
        console.log('🚀 Starting automated video generation task...');

        let browser;
        let pages;
        let page;

        // Read prompts from Excel file
        const inputPath = path.resolve(__dirname, '../../inputs/prompts.xlsx');
        let workbook = XLSX.readFile(inputPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        console.log(`📋 Found ${rows.length} prompts to process`);

        try {
            if ((await getVideoGenHeaders()) === null) {
                console.log('🔑 No valid tokens found, opening browser to get new tokens...');
                browser = await openBrowser(true);
                pages = await browser.pages();
                page = pages[0];
                page = await configurePage(page);
                await attachVideoGenLoggerCDP(page);
                await getTokens(page);
                await closeBrowser();
            } else {
                await closeBrowser();
            }
        } catch (error) {
            console.error('❌ Error initializing browser or getting tokens:', error.message);
            throw error;
        } finally {
            await closeBrowser();
        }

        // Process each prompt
        for (let row of rows) {
            if (row.status === 'success') {
                console.log(`✅ Prompt no.${row.no} already processed successfully, skipping.`);
                continue;
            }

            try {
                console.log(`📝 Processing prompt no.${row.no}`);

                const videoId = await generateVideoAPI(await getVideoGenHeaders(), row.prompt, row.ref_img);
                if (videoId) {
                    row.video_id = videoId;
                    row.status = 'success';
                    console.log(`✅ Successfully generated video for prompt no. ${row.no}`);
                } else {
                    console.error(`❌ Failed to generate video for prompt no. ${row.no}`);
                    row.status = 'failed';
                }

                console.log('⏳ Waiting before next generation...');
                await delay(5000, 10000); // Wait 5-10 seconds
            } catch (error) {
                console.error(`❌ Error processing prompt ${row.no}:`, error.message);
                row.status = 'failed';
            }
        }

        // Update Excel file with results
        const newSheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
        workbook.Sheets[sheetName] = newSheet;
        XLSX.writeFile(workbook, inputPath);

        console.log('🎉 Task completed! Check Sora for your generated videos.');
        console.log('📊 Results have been saved to inputs/prompts.xlsx');
    } catch (error) {
        console.error('💥 Task failed:', error.message);
        throw error;
    }
};

// Export for direct usage
export default doTask;
