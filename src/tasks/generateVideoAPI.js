import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { delay } from '../utils.js';
import { fileURLToPath } from 'url';
import { getVideoGenHeaders, resetVideoGenHeaders } from '../lib/browser.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_POLLING_INTERVAL = { min: 10000, max: 10000 };
const MAX_CONCURRENT_REQUESTS = 1; // Adjust this based on your needs
let MAX_RETRIES = 5; // Maximum number of retries for each request

export const generateVideoAPI = async (videoGenHeader, prompt, ref_img) => {
    const settings = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../settings.json'), 'utf-8'));
    while (true) {
        const numberOFSlots = await numberOfAvailableSlots();
        if (numberOFSlots >= MAX_CONCURRENT_REQUESTS) {
            console.log(`Max concurrent requests reached, waiting ${STATUS_POLLING_INTERVAL.max / 1000}s for available slots...`);
            await delay(STATUS_POLLING_INTERVAL.min, STATUS_POLLING_INTERVAL.max); // Wait for 30 s
            continue; // Retry after waiting
        }
        try {
            let data = JSON.stringify({
                type: 'video_gen',
                operation: 'simple_compose',
                prompt: prompt,
                n_variants: settings.sora.n_variants,
                n_frames: settings.sora.n_frames,
                width: settings.sora.width,
                height: settings.sora.height,
                inpaint_items: [],
                model: 'turbo',
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://sora.chatgpt.com/backend/video_gen',
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    origin: 'https://sora.chatgpt.com',
                    referer: 'https://sora.chatgpt.com/library',
                    'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                    ...videoGenHeader,
                },
                data: data,
            };

            if (ref_img) {
                const uploadedImageId = await uploadImg(ref_img);
                console.log('ref image uploaded');
                config.data = JSON.stringify({
                    ...JSON.parse(config.data),
                    inpaint_items: [
                        {
                            upload_media_id: uploadedImageId,
                            frame_index: 0,
                            generation_id: null,
                            preset_id: null,
                            source_end_frame: 0,
                            source_start_frame: 0,
                            type: 'image',
                            uploaded_file_id: null,
                            crop_bounds: {
                                bounds: [0, 0, 1, 1],
                            },
                        },
                    ],
                });
            }

            const response = await axios.request(config);
            console.log('Video generation request sent successfully:', response.data);
            return response.data.id; // Return the video ID
        } catch (error) {
            if (error.status === 429) {
                console.log('Max concurrent requests reached, waiting for 2 Minute...');
                await delay(60000, 120000); // Wait for 1-2 minutes
                continue;
            } else if (error.status >= 400) {
                console.log(error.response);
                console.log('Bad request, try get new token!');
            } else {
                console.error('Error generating video:', error.response.data);
                console.log('Retrying video generation...');
            }
            if (MAX_RETRIES-- <= 0) {
                console.error('Max retries reached, exiting...');
                return null; // Exit if max retries reached
            }
        }
    }
};

const uploadImg = async (ref_img) => {
    try {
        const customHeaders = await getVideoGenHeaders();
        const filePath = path.resolve(__dirname, `../../inputs/images/${ref_img}`);
        const data = new FormData();

        data.append('file', fs.createReadStream(filePath));
        data.append('file_name', 'girl.webp');

        const response = await axios.post('https://sora.chatgpt.com/backend/uploads', data, {
            headers: {
                origin: 'https://sora.chatgpt.com',
                priority: 'u=1, i',
                referer: 'https://sora.chatgpt.com/library',
                'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'Content-Type': 'multipart/form-data',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                authorization: customHeaders.authorization,
                cookie: customHeaders.cookie,
                priority: customHeaders.priority,
                ...data.getHeaders(),
            },
            data: data,
        });

        // console.log(response.data.id);

        return response.data.id;
    } catch (error) {
        console.error('Error uploading image:', error.response.data);
        throw error;
    }
};

const numberOfAvailableSlots = async () => {
    const customHeaders = await getVideoGenHeaders();
    if (!customHeaders) return MAX_CONCURRENT_REQUESTS * 2;

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://sora.chatgpt.com/backend/video_gen?limit=5',
        headers: {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            Referer: 'https://sora.chatgpt.com/library',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
            authorization: customHeaders.authorization,
            cookie: customHeaders.cookie,
            priority: customHeaders.priority,
        },
    };

    let counter = 0;

    try {
        const response = await axios.request(config);
        const tasks = response.data.task_responses;
        if (tasks && tasks.length > 0) {
            for (const task of tasks) {
                if (!['succeeded', 'failed', 'cancelled'].includes(task.status)) {
                    counter++;
                }
            }
        }
        if (counter > 0) {
            console.log(`Current concurrent requests: ${counter}`);
        }
        return counter;
    } catch (error) {
        console.error('Error checking concurrent requests:', error.response.data);
    }
};
