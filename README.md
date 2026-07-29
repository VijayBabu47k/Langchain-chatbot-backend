# FastChatbot Backend

A well-organized, scalable Node.js backend for the FastChatbot application using Express.js and Socket.io.

## Project Structure

```
backend/
├── config/
│   └── config.js           # Centralized configuration and constants
├── controllers/
│   ├── chatController.js   # Chat endpoint logic
│   └── imageController.js  # Image generation logic
├── routes/
│   ├── chatRoutes.js       # Chat route definitions
│   └── imageRoutes.js      # Image route definitions
├── utils/
│   └── tokenUtils.js       # Token estimation and message pruning utilities
├── middleware/
│   └── errorHandler.js     # Error handling middleware
├── server.js               # Main application entry point
├── .env                    # Environment variables (git ignored)
├── .env.example            # Example environment variables
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Directory Descriptions

### `/config`
Stores centralized configuration, environment variables, and constants used throughout the application.

**Files:**
- `config.js` - Loads and exports all configuration values

### `/controllers`
Contains business logic for each API endpoint. Controllers handle requests, validate input, and coordinate with external services.

**Files:**
- `chatController.js` - Handles chat streaming requests to DeepInfra API
- `imageController.js` - Handles image generation requests

### `/routes`
Defines Express route handlers and maps them to controller functions.

**Files:**
- `chatRoutes.js` - Routes for `/api/chat` and `/api/health`
- `imageRoutes.js` - Routes for `/api/generate-image` and `/api/image-health`

### `/utils`
Contains reusable utility functions and helpers.

**Files:**
- `tokenUtils.js` - Token estimation, context calculation, and message pruning

### `/middleware`
Custom middleware for request/response processing and error handling.

**Files:**
- `errorHandler.js` - Global error handling and 404 responses

## API Endpoints

### Chat Endpoints
- `POST /api/chat` - Stream chat response
- `GET /api/health` - Health check

### Image Endpoints
- `POST /api/generate-image` - Generate image from prompt
- `GET /api/image-health` - Image service health check

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
DEEPINFRA_API_KEY=your_api_key_here
CHAT_MODEL_NAME=meta-llama/Llama-2-70b-chat-hf
IMAGE_MODEL_NAME=black-forest-labs/FLUX-2-klein-9b
```

## Running the Server

### Development
```bash
npm start
```

### With Watch Mode
```bash
npm run dev
```

## Technology Stack

- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **Axios** - HTTP client
- **CORS** - Cross-Origin Resource Sharing
- **Dotenv** - Environment variable management

## Key Features

- ✅ **Modular Architecture** - Separated concerns with clear folder structure
- ✅ **Token Management** - Smart message pruning for API limits
- ✅ **Streaming Responses** - SSE streaming for real-time chat
- ✅ **Error Handling** - Centralized error middleware
- ✅ **Configuration Management** - Centralized config file
- ✅ **Health Checks** - Service health monitoring endpoints

## Development Guidelines

1. **Adding New Routes**: Create new file in `/routes`, then import in `server.js`
2. **Adding New Controllers**: Create new file in `/controllers`, import in routes
3. **Adding Utilities**: Place reusable functions in `/utils`
4. **Configuration**: Add all constants to `config/config.js`

## Notes

- The backend uses DeepInfra API for both chat and image generation
- Messages are pruned to maintain token limits
- Socket.io is configured for both WebSocket and HTTP polling transports
