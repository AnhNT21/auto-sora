# Auto-Sora - Automated Sora Video Generation

A Node.js automation tool for generating videos using OpenAI's Sora platform. Simply add your prompts to an Excel file and reference images to the images folder, then run the automation.

## 🚀 Quick Start

### Prerequisites

-   **Node.js** (v18 or higher)
-   **Chrome/Chromium browser** or **TitanBrowser**
-   **Sora access** (you need access to https://sora.chatgpt.com)

### Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd auto-sora
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Configure browser paths**

    Edit `src/configs/index.js` and update the browser executable paths:

    ```javascript
    BROWSER: {
        // For macOS (TitanBrowser)
        DARWIN_EXECUTABLE_PATH: './browser/TitanBrowser.app/Contents/MacOS/TitanBrowser',

        // For Windows (Chrome)
        WIN32_EXECUTABLE_PATH: 'C:/Users/ADMIN/Desktop/A1/auto-sora/browser/chrome.exe',

        // Other settings...
    }
    ```

4. **Set up your inputs**

    Create sample files and check out the `inputs/` folder:

    ```bash
    npm run setup
    ```

    This creates:

    - **Prompts**: Sample `inputs/prompts.xlsx` file
    - **Images**: Place reference images in `inputs/images/` folder

    See the [Inputs Guide](#inputs-guide) below for detailed instructions.

5. **Run the automation**

    **Windows Users:**

    ```bash
    run-auto.cmd
    ```

    **Mac/Linux Users:**

    ```bash
    npm start
    ```

## 📁 Inputs Guide

### Setting Up Your Prompts

1. **Open the Excel file**: `inputs/prompts.xlsx`
2. **Add your prompts**: Each row should contain:
    - `no`: Prompt number (1, 2, 3, etc.)
    - `prompt`: Your video description text
    - `ref_img`: Reference image filename (optional)
    - `status`: Leave empty (will be updated automatically)

**Example Excel content:**
| no | prompt | ref_img | status |
|----|--------|---------|--------|
| 1 | A beautiful sunset over the ocean | sunset.jpg | |
| 2 | A cat playing with yarn | cat.png | |
| 3 | A futuristic cityscape | city.jpg | |

### Adding Reference Images

1. **Place images** in the `inputs/images/` folder
2. **Supported formats**: `.jpg`, `.jpeg`, `.png`
3. **Reference in Excel**: Use the exact filename in the `ref_img` column
4. **Optional**: You can generate videos without reference images

**Example folder structure:**

```
inputs/
├── prompts.xlsx
└── images/
    ├── sunset.jpg
    ├── cat.png
    └── city.jpg
```

## 📖 Usage

### Quick Run

**Windows:**

```bash
run-auto.cmd
```

**Mac/Linux:**

```bash
npm start
```

The automation will:

1. Read prompts from `inputs/prompts.xlsx`
2. Upload reference images if specified
3. Generate videos using Sora
4. Update the Excel file with status (success/failed)

### Monitor Progress

-   **Console logs**: Check the terminal for detailed progress
-   **Excel updates**: Status will be updated in the prompts file
-   **Sora dashboard**: Check https://sora.chatgpt.com for generated videos

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

## 🔧 Configuration

### Browser Settings

Edit `src/configs/index.js` to customize:

```javascript
export const configs = {
    SERVER_LOGS: true, // Enable/disable server logs
    FILE_LOGS: false, // Enable/disable file logging
    BROWSER: {
        HEADLESS: false, // Set to true for headless mode
        CHROME_PROFILE_PATH: '../browser/chrome_profile',
        DARWIN_EXECUTABLE_PATH: './browser/TitanBrowser.app/Contents/MacOS/TitanBrowser',
        WIN32_EXECUTABLE_PATH: 'C:/path/to/your/chrome.exe',
        USER_AGENT: 'Mozilla/5.0...',
        ARGS: [
            '--disable-blink-features=AutomationControlled',
            // ... other arguments
        ],
        HEADER: {
            'Accept-Language': 'en-US,en;q=0.9',
            // ... other headers
        },
    },
};
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
# Add other environment variables as needed
```

## 📁 Project Structure

```
auto-sora/
├── src/                    # Source code
│   ├── configs/           # Configuration files
│   │   └── index.js       # Main configuration
│   ├── lib/               # Browser automation library
│   │   └── browser.js     # Browser management
│   ├── tasks/             # Automation tasks
│   │   ├── doTask.js      # Main task runner
│   │   └── generateVideos.js # Video generation logic
│   ├── app.js             # Express app setup
│   ├── server.js          # Server entry point
│   └── utils.js           # Utility functions
├── inputs/                # Input files
│   ├── prompts.xlsx       # Your video prompts
│   └── images/            # Reference images
├── browsers/              # Browser executables
├── run-auto.cmd           # Windows run script
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🛠️ Customization

### Adding Custom Prompts

1. **Edit Excel file**: `inputs/prompts.xlsx`
2. **Add new rows** with your prompts
3. **Include reference images** if desired
4. **Run automation**: The tool will process all prompts

### Using Reference Images

1. **Add images** to `inputs/images/`
2. **Reference in Excel** using the filename
3. **Supported formats**: `.jpg`, `.png`, `.jpeg`
4. **Optional**: Videos can be generated from text only

### Browser Customization

-   **Headless Mode**: Set `HEADLESS: true` for background operation
-   **Custom Profile**: Update `CHROME_PROFILE_PATH` for persistent sessions
-   **User Agent**: Modify `USER_AGENT` if needed for compatibility

## 🐛 Troubleshooting

### Common Issues

1. **Browser not found**

    ```
    Error: Browser executable not found for this platform
    ```

    **Solution**: Update the executable paths in `src/configs/index.js`

2. **Sora access denied**

    ```
    Error: No suitable textarea found for video description
    ```

    **Solution**: Ensure you have access to Sora and are logged in

3. **Excel file not found**

    ```
    Error: Cannot find prompts.xlsx
    ```

    **Solution**: Check that `inputs/prompts.xlsx` exists and has the correct format

4. **Reference image not found**

    ```
    Error: File input for reference image not found
    ```

    **Solution**: Check that the image file exists in `inputs/images/`

5. **Port already in use**
    ```
    Error: listen EADDRINUSE: address already in use :::3000
    ```
    **Solution**: Change the PORT in your `.env` file or kill the existing process

### Debug Mode

Enable detailed logging by setting `SERVER_LOGS: true` in the config.

### Manual Testing

1. Start the server: `npm start`
2. Check console logs for detailed information
3. Verify Excel file format and image paths

## 📝 Excel File Format

### Required Columns

| Column    | Description                         | Example              |
| --------- | ----------------------------------- | -------------------- |
| `no`      | Prompt number (unique)              | 1, 2, 3              |
| `prompt`  | Video description text              | "A beautiful sunset" |
| `ref_img` | Reference image filename (optional) | "sunset.jpg"         |
| `status`  | Processing status (auto-updated)    | "success", "failed"  |

### Example Excel Content

```excel
no | prompt                    | ref_img      | status
1  | A beautiful sunset        | sunset.jpg   | success
2  | A cat playing with yarn   | cat.png      | failed
3  | A futuristic cityscape    |              | pending
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

**For Developers**:

-   [DEVELOPER.md](./DEVELOPER.md) - Detailed technical documentation, API reference, and contribution guidelines
-   [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) - Quick reference for common development tasks

## 📄 License

This project is for educational purposes. Please ensure you comply with OpenAI's terms of service when using Sora.

## ⚠️ Disclaimer

This tool is for educational and personal use only. Please:

-   Respect OpenAI's terms of service
-   Use responsibly and ethically
-   Don't overload the Sora service
-   Ensure you have proper access to Sora before using this tool

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console logs for error details
3. Ensure your browser and Node.js versions are compatible
4. Verify your Sora access is active

For additional help, please open an issue with:

-   Your operating system
-   Node.js version
-   Browser type and version
-   Error messages from the console
-   Steps to reproduce the issue
