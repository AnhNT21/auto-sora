# Auto-Sora Developer Documentation

This document is for developers who want to understand, modify, or contribute to the Auto-Sora automation tool.

## 🏗️ Architecture Overview

### Project Structure

```
auto-sora/
├── src/                    # Source code
│   ├── configs/           # Configuration management
│   │   └── index.js       # Main configuration object
│   ├── lib/               # Core libraries
│   │   └── browser.js     # Browser automation wrapper
│   ├── tasks/             # Automation tasks
│   │   ├── doTask.js      # Main task orchestrator
│   │   └── generateVideos.js # Sora video generation logic
│   ├── routes/            # Express routes (if using API)
│   ├── app.js             # Express application setup
│   ├── server.js          # HTTP server entry point
│   └── utils.js           # Utility functions
├── inputs/                # User input files
│   ├── prompts.xlsx       # Video prompts (Excel format)
│   └── images/            # Reference images
├── browsers/              # Browser executables
├── backup/                # Backup files
└── scripts/               # Build and utility scripts
```

### Core Components

1. **Browser Management** (`src/lib/browser.js`)

    - Handles Puppeteer browser lifecycle
    - Page configuration and automation setup
    - Cross-platform browser executable management

2. **Task Orchestration** (`src/tasks/doTask.js`)

    - Reads prompts from Excel files
    - Manages video generation workflow
    - Updates status in Excel files

3. **Video Generation** (`src/tasks/generateVideos.js`)

    - Sora website automation
    - Text input and image upload handling
    - Error handling and retry logic

4. **Configuration** (`src/configs/index.js`)
    - Browser settings and paths
    - Logging configuration
    - User agent and headers

## 🔧 Development Setup

### Prerequisites

-   **Node.js** (v18+)
-   **npm** or **yarn**
-   **Git**
-   **Chrome/Chromium** or **TitanBrowser**

### Installation

```bash
# Clone repository
git clone <repository-url>
cd auto-sora

# Install dependencies
npm install

# Create sample files
npm run setup

# Start development server
npm run dev
```

### Development Scripts

```bash
npm start          # Production server
npm run dev        # Development with auto-restart
npm run setup      # Create sample Excel file
npm test           # Run tests (when implemented)
```

## 📝 Code Architecture

### Module System

The project uses ES modules with the following patterns:

```javascript
// Import utilities
import { delay, log } from '../utils.js';

// Import configuration
import { configs } from '../configs/index.js';

// Import browser automation
import { newPage, configurePage } from '../lib/browser.js';
```

### Error Handling

All functions use try-catch blocks with proper error logging:

```javascript
try {
    const result = await generateVideos(page, prompt, refImage);
    return { success: true, data: result };
} catch (error) {
    log(`Error in generateVideos: ${error.message}`, 'error');
    return { success: false, message: error.message };
}
```

### Configuration Management

Configuration is centralized in `src/configs/index.js`:

```javascript
export const configs = {
    SERVER_LOGS: true,
    FILE_LOGS: false,
    BROWSER: {
        HEADLESS: false,
        DARWIN_EXECUTABLE_PATH: './browser/TitanBrowser.app/...',
        WIN32_EXECUTABLE_PATH: 'C:/path/to/chrome.exe',
        USER_AGENT: 'Mozilla/5.0...',
        ARGS: ['--disable-blink-features=AutomationControlled'],
        HEADER: { 'Accept-Language': 'en-US,en;q=0.9' },
    },
};
```

## 🎯 Core Functions

### Browser Management

#### `openBrowser(headless = false)`

Opens and manages Puppeteer browser instance.

```javascript
const browser = await openBrowser(true); // Headless mode
```

#### `configurePage(page)`

Configures a page with anti-detection measures.

```javascript
const page = await browser.newPage();
await configurePage(page);
```

#### `newPage()`

Creates a new configured page.

```javascript
const page = await newPage();
```

### Task Management

#### `doTask(page)`

Main task orchestrator that:

-   Reads prompts from Excel file
-   Processes each prompt
-   Updates status in Excel file

```javascript
const page = await newPage();
await doTask(page);
```

#### `generateVideos(page, prompt, refImage)`

Handles individual video generation:

-   Navigates to Sora
-   Inputs prompt text
-   Uploads reference image (if provided)
-   Submits for generation

```javascript
const result = await generateVideos(page, 'A beautiful sunset', 'sunset.jpg');
```

### Utility Functions

#### `delay(min, max)`

Creates random delays to avoid detection.

```javascript
await delay(1000, 3000); // Random delay between 1-3 seconds
```

#### `log(message, type)`

Centralized logging with configurable output.

```javascript
log('Processing video generation', 'info');
log('Error occurred', 'error');
```

## 🔄 Data Flow

### 1. Input Processing

```
Excel File → doTask.js → Parse prompts → Process each row
```

### 2. Video Generation

```
Prompt + Image → generateVideos.js → Sora Website → Video Generation
```

### 3. Status Updates

```
Generation Result → Update Excel → Save to file
```

## 🛠️ Customization Guide

### Adding New Browser Support

1. **Update `getExecutable()` in `utils.js`**:

```javascript
case 'linux':
    return configs.BROWSER.LINUX_EXECUTABLE_PATH || '';
```

2. **Add path to config**:

```javascript
LINUX_EXECUTABLE_PATH: '/usr/bin/google-chrome',
```

### Adding New Video Platforms

1. **Create new task file** (e.g., `generateVideosOther.js`)
2. **Implement platform-specific logic**
3. **Update `doTask.js` to use new function**

### Customizing Browser Behavior

Modify `src/lib/browser.js`:

```javascript
// Add custom arguments
args: [...configs.BROWSER.ARGS, '--custom-flag', '--another-flag'],
    // Custom page configuration
    await page.evaluateOnNewDocument(() => {
        // Custom anti-detection code
    });
```

### Adding New Input Formats

1. **Create parser function** in `utils.js`
2. **Update `doTask.js`** to use new parser
3. **Add format detection logic**

## 🧪 Testing

### Manual Testing

```bash
# Test browser setup
npm start
curl http://localhost:3000/browser

# Test video generation
curl http://localhost:3000/auto
```

### Automated Testing (Future)

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🐛 Debugging

### Enable Debug Logging

```javascript
// In configs/index.js
export const configs = {
    SERVER_LOGS: true,
    DEBUG_MODE: true,
    // ...
};
```

### Browser Debugging

```javascript
// In browser.js
const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Opens DevTools
    slowMo: 1000, // Slows down operations
});
```

### Common Issues

1. **Browser not found**

    - Check executable paths in config
    - Verify browser installation

2. **Sora access denied**

    - Ensure logged into Sora
    - Check for CAPTCHA or verification

3. **Excel file errors**
    - Verify file format (.xlsx)
    - Check column names match expected format

## 📊 Performance Optimization

### Memory Management

```javascript
// Close pages when done
await page.close();

// Clear browser cache periodically
await page.evaluate(() => {
    if ('caches' in window) {
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
    }
});
```

### Rate Limiting

```javascript
// Add delays between requests
await delay(2000, 5000);

// Implement exponential backoff
const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
```

## 🔒 Security Considerations

### Input Validation

```javascript
// Validate prompt content
if (!prompt || prompt.length > 1000) {
    throw new Error('Invalid prompt length');
}

// Validate image files
const allowedExtensions = ['.jpg', '.jpeg', '.png'];
if (refImage && !allowedExtensions.some((ext) => refImage.endsWith(ext))) {
    throw new Error('Invalid image format');
}
```

### Error Handling

```javascript
// Don't expose internal errors to users
catch (error) {
    log(error.message, 'error');
    return { success: false, message: 'An error occurred' };
}
```

## 🤝 Contributing

### Code Style

-   Use ES6+ features
-   Prefer async/await over Promises
-   Use descriptive variable names
-   Add JSDoc comments for functions

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit PR with description

### Commit Messages

Use conventional commits:

```
feat: add new browser support
fix: resolve Excel parsing issue
docs: update API documentation
test: add unit tests for utils
```

## 📚 API Reference

### Browser API

| Function        | Parameters           | Returns            | Description              |
| --------------- | -------------------- | ------------------ | ------------------------ |
| `openBrowser`   | `headless?: boolean` | `Promise<Browser>` | Opens browser instance   |
| `newPage`       | -                    | `Promise<Page>`    | Creates configured page  |
| `configurePage` | `page: Page`         | `Promise<void>`    | Configures page settings |
| `closeBrowser`  | -                    | `Promise<void>`    | Closes browser instance  |

### Task API

| Function         | Parameters                                      | Returns           | Description            |
| ---------------- | ----------------------------------------------- | ----------------- | ---------------------- |
| `doTask`         | `page: Page`                                    | `Promise<void>`   | Main task orchestrator |
| `generateVideos` | `page: Page, prompt: string, refImage?: string` | `Promise<Result>` | Generates video        |

### Utility API

| Function        | Parameters                       | Returns          | Description      |
| --------------- | -------------------------------- | ---------------- | ---------------- |
| `delay`         | `min: number, max: number`       | `Promise<void>`  | Random delay     |
| `log`           | `message: string, type?: string` | `void`           | Logging function |
| `getExecutable` | -                                | `string \| null` | Get browser path |

## 🔮 Future Enhancements

### Planned Features

-   [ ] Support for multiple video platforms
-   [ ] Batch processing with progress tracking
-   [ ] Web UI for configuration
-   [ ] Docker containerization
-   [ ] Cloud deployment support

### Technical Debt

-   [ ] Add comprehensive unit tests
-   [ ] Implement proper error recovery
-   [ ] Add performance monitoring
-   [ ] Improve browser detection
-   [ ] Add configuration validation

## 📞 Support

For developer support:

1. Check this documentation
2. Review existing issues
3. Create detailed bug reports
4. Join developer discussions

### Getting Help

-   **Documentation**: This file and README.md
-   **Issues**: GitHub issues page
-   **Discussions**: GitHub discussions
-   **Code**: Review source code in `src/` directory
