# Auto-Sora JavaScript Project

This project has been converted back to JavaScript while maintaining all the improvements and fixes that were made during the TypeScript conversion.

## Project Structure

```
auto-sora/
├── src/                    # JavaScript source files
│   ├── configs/           # Configuration files
│   ├── lib/               # Browser automation library
│   ├── routes/            # Express routes
│   ├── tasks/             # Automation tasks
│   ├── app.js             # Express app setup
│   ├── server.js          # Server entry point
│   └── utils.js           # Utility functions
├── backup/                # Backup of original files
│   └── js-files/          # Original .js files
├── browsers/              # Browser executables
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Features

-   **JavaScript**: Modern ES modules with improved error handling
-   **Browser Automation**: Puppeteer-based automation for Sora video generation
-   **Express Server**: RESTful API endpoints
-   **Improved Error Handling**: Better error handling and logging
-   **Development Tools**: Watch mode for development

## Installation

```bash
npm install
```

## Development

```bash
# Start development server with watch mode
npm run dev

# Start production server
npm start
```

## API Endpoints

-   `GET /` - Health check
-   `GET /auto/run` - Run video generation automation

## Improvements from TypeScript Conversion

The project maintains all the improvements that were made during the TypeScript conversion:

-   **Better Error Handling**: Improved error handling with proper error messages
-   **Enhanced Browser Automation**: Better browser management with proper cleanup
-   **Improved Code Structure**: Cleaner code organization and better practices
-   **Fixed Runtime Errors**: Resolved issues like undefined variables and missing imports
-   **Better Logging**: Enhanced logging system with configurable output

## Migration Notes

The project has been converted back to JavaScript while preserving all the functional improvements:

-   Removed type annotations but kept all functional improvements
-   Maintained enhanced error handling and logging
-   Preserved improved browser automation logic
-   Kept better code structure and organization
-   Fixed all runtime errors that were discovered during TypeScript conversion

## Configuration

Edit `src/configs/index.js` to modify browser settings, logging preferences, and other configurations.

## Browser Setup

The project uses a custom browser executable located in the `browsers/` directory. Make sure the browser is properly configured for your platform.
