import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { generateVideos } from './generateVideos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const doTask = async (page) => {
    const inputPath = path.resolve(__dirname, '../../inputs/prompts.xlsx');
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    for (const row of rows) {
        if (row.status === 'success') {
            console.log(`Prompt no. ${row.no} already processed successfully, skipping.`);
            continue;
        }

        try {
            console.log(`Processing prompt no.: ${row.no}`);

            await generateVideos(page, row.prompt, row.ref_img);

            console.log(`Prompt no. ${row.no} processed successfully.`);
            row.status = 'success';
        } catch {
            row.status = 'failed';
        }
    }

    const newSheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
    workbook.Sheets[sheetName] = newSheet;

    XLSX.writeFile(workbook, inputPath);
};
