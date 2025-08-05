# Gemini Chat with Integrations

This project is a web-based chat application powered by the Google Gemini API, and it includes a backend server designed for integration with the Yemot HaMashiach IVR (telephony) system, Telegram, and other services.

## Features

- **Web Interface**: A clean, modern chat interface for direct interaction with Gemini.
- **Advanced Tools**: The AI can browse websites and search Twitter for real-time information.
- **Multi-Platform**: Interact via the web, a phone call (Yemot HaMashiach), or Telegram.
- **Chat History**: Conversations are saved locally in your browser.
- **Easy Configuration**: A settings panel allows you to personalize the AI's behavior and manage API keys, with direct links to required services.

## Project Structure

- **Frontend (root directory)**: Contains the React-based web application (`index.html`, `App.tsx`, etc.).
- **Backend (`/server` directory)**: Contains a Node.js/Express server that acts as a bridge for Yemot HaMashiach, Telegram, and provides secure proxy services for the frontend's tools.

---

## Configuration Guide

To use the full functionality, you will need several API keys. **You can find direct links to all required services in the app's Settings panel (click the ⚙️ icon).**

### 1. Google Gemini API Key (Required)
- **Purpose**: The core key for the AI to function on all platforms.
- **Where to get it**: From the **Google AI Studio**.
- **Where to put it**: In the `server/.env` file, add the line: `API_KEY="YOUR_GEMINI_KEY_HERE"`. This key is used by the server for all integrations.

### 2. Server URL (Required for Telegram)
- **Purpose**: Your server's public web address.
- **Where to get it**: This is the URL provided by your hosting service (e.g., Render, Heroku) after you deploy the server.
- **Where to put it**: In the `server/.env` file, add: `SERVER_URL="https://your-deployed-server-url.com"`.

### 3. Telegram Bot Token (Optional)
- **Purpose**: Connects a Telegram Bot to your AI assistant.
- **Setup**:
    1. **Get a Token**: Talk to the **BotFather** on Telegram to create a new bot and get its unique token.
    2. **Add Token to Server**: In the `server/.env` file, add: `TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN_HERE"`.
    3. **Set Webhook**: After deploying your server, you need to tell Telegram where to send messages. Do this by visiting a special URL in your browser **only once**:
       `https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_SERVER_URL>/api/telegram`
       - Replace `<YOUR_TOKEN>` with your bot token.
       - Replace `<YOUR_SERVER_URL>` with your server's public URL from step 2.
    - You should see `{"ok":true,"result":true,"description":"Webhook was set"}`. Your bot is now ready!

### 4. Twitter Bearer Token (Optional)
- **Purpose**: Allows the AI to search for recent tweets.
- **Where to get it**: From the **Twitter Developer Portal**.
- **Where to put it**: Enter this key directly into the **Settings panel** in the web application.

### 5. Yemot HaMashiach Integration (Optional)
- **Purpose**: Connects a phone number to your AI assistant.
- **Setup**: In your Yemot HaMashiach account's `ext.ini` file, add:
    ```ini
    type=api
    api_url=https://your-deployed-server-url.com/api/yemot
    api_url_post_params=prompt=${Api_To_List}
    api_url_read_data=yes
    ```

---

## Backend Server Deployment

The server is required for the Yemot and Telegram integrations and for the web app's tools to work.

1.  **Navigate to the `server` directory**: `cd server`
2.  **Create `.env` file**: Create a file named `.env` and add your keys as described in the configuration guide.
3.  **Install dependencies**: `npm install`
4.  **Run locally for testing**: `npm start`
5.  **Deploy**: Deploy the `/server` directory to a public hosting service like Render or Heroku. The included `Dockerfile` can be used for easy deployment.