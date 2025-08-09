import express from 'express';
import dotenv from 'dotenv';
import { doTask } from './tasks/doTask.js';
import { configurePage, newPage, openBrowser } from './lib/browser.js';
const app = express();

dotenv.config();

// Serve static HTML if needed
app.get('/', (req, res) => {
    res.send('Server is running...');
});

// app.get('/auto', automationRouter);
app.get('/auto', async (req, res) => {
    const browser = await openBrowser();
    // let page = await newPage();
    const pages = await browser.pages();
    let page = pages[0];
    page = await configurePage(page);

    doTask(page);

    res.send('Task running... Check the server logs for progress.');
});

app.get('/browser', async (req, res) => {
    const browser = await openBrowser();
    const pages = await browser.pages();
    let page = pages[0];
    page = await configurePage(page);

    res.send('Browser opened and page configured. Check the server logs for details.');
});

export default app;
