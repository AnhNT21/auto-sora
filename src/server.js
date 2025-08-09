import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { closeBrowser } from './lib/browser.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});

const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
        await closeBrowser();
        process.exit(0);
    });
};

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
