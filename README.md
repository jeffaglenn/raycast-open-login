# Open Login - Raycast Extension

A Raycast extension for quickly finding and opening login files from a designated folder.

## Features

- Search and filter login files as you type
- View files sorted by modification date (most recent first)
- Open files with the default application
- Show file in Finder
- Copy file path or name to clipboard

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the login folder path in Raycast preferences (default: `~/Documents/Logins`)

3. Run the extension in development mode:
   ```bash
   npm run dev
   ```

## Usage

1. Open Raycast
2. Type "Open Login" or use the configured alias
3. Start typing to filter login files
4. Press Enter to open the selected file

## Configuration

You can configure the login folder path in Raycast preferences:
- Go to Raycast Settings
- Find the "Open Login" extension
- Update the "Login Files Folder" path

## Icon

**Note:** You need to add a `command-icon.png` file in the `assets` folder. The recommended size is 512x512px.

## License

MIT
