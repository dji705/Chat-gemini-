# Gemini Chat with Yemot HaMashiach Integration

This project is a web-based chat application powered by the Google Gemini API, and it includes a backend server designed for integration with the Yemot HaMashiach IVR (telephony) system.

## Features

- **Web Interface**: A clean, modern chat interface for direct interaction with Gemini.
- **Chat History**: Conversations are saved locally in your browser.
- **Yemot HaMashiach Integration**: A dedicated backend server that allows users to interact with Gemini over a phone call.

## Project Structure

- **Frontend (root directory)**: Contains the React-based web application (`index.html`, `App.tsx`, etc.). This part of the application runs entirely in the user's browser.
- **Backend (`/server` directory)**: Contains a Node.js/Express server. This server has a single purpose: to provide an API endpoint for the Yemot HaMashiach system.

---

## Backend for Yemot HaMashiach

The server located in the `/server` directory acts as a bridge between the Yemot HaMashiach system and the Gemini API.

### How it Works

1.  A user calls a number configured in your Yemot HaMashiach account.
2.  The IVR prompts the user to type their question.
3.  Yemot sends the user's input to the `/api/yemot` endpoint on this server.
4.  The server takes the question, sends it to the Gemini API, and gets a response.
5.  The server formats the response as a text-to-speech command and sends it back to Yemot.
6.  The Yemot system reads the answer back to the user over the phone.

### Setup and Deployment

**1. Prerequisites**
- Node.js (v18 or later)
- A Google Gemini API Key.
- A Yemot HaMashiach account.

**2. Backend Configuration**

- Navigate to the `server` directory: `cd server`
- Create a `.env` file by copying the example: `cp .env.example .env`
- Open the `.env` file and paste your Google Gemini API Key:
  ```
  API_KEY="YOUR_GEMINI_API_KEY_HERE"
  ```
- Install dependencies: `npm install`

**3. Running the Server Locally**

- From the `server` directory, run: `npm start`
- The server will start, typically on port 3001. The endpoint will be `http://localhost:3001/api/yemot`.

**4. Deployment**

For Yemot HaMashiach to access your server, it must be deployed to a public URL (e.g., using services like Heroku, Render, or a VPS). The included `Dockerfile` can be used to containerize the application for easy deployment.

- Build the Docker image: `docker build -t gemini-yemot-server .`
- Run the container: `docker run -p 3001:3001 -e API_KEY="YOUR_GEMINI_API_KEY" gemini-yemot-server`

**5. Yemot HaMashiach Configuration**

In your Yemot HaMashiach account, you need to configure an extension to make an API call to your deployed server's endpoint.

- Go to the desired folder in your IVR system.
- Add the following line to your `ext.ini` file:
  ```ini
  type=api
  api_url=https://your-deployed-server-url.com/api/yemot
  api_url_post_params=prompt=${Api_To_List}
  api_url_read_data=yes
  ```
- This configuration will take the user's typed input (`Api_To_List`) and send it as a `prompt` to your server. The server's response will then be read back to the user.

---

## Frontend Web Application

The existing web application can be run locally or hosted as a static site. No changes are required for it to function, but remember that it requires the `API_KEY` to be set in its own environment during its build process.
