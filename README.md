# Chatbot Engine Backend

A well-organized, scalable Node.js backend for the Chatbot Engine application using Express.js and Socket.io.

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
CHAT_MODEL_NAME=your_model
IMAGE_MODEL_NAME=your_model
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

## API Request/Response Examples

### Chat Streaming (SSE)
**Request:**
```bash
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

**Response (Server-Sent Events):**
```
data: {"choices":[{"delta":{"content":"I'm"}}]}
data: {"choices":[{"delta":{"content":" doing"}}]}
data: {"choices":[{"delta":{"content":" well"}}]}
data: [DONE]
```

### Image Generation
**Request:**
```bash
POST /api/generate-image
Content-Type: application/json

{
  "prompt": "A beautiful sunset over mountains"
}
```

**Response:**
```json
{
  "imageUrl": "data:image/png;base64,..."
}
```

## Notes

- The backend uses DeepInfra API for both chat and image generation
- Messages are pruned to maintain token limits (default: 8000 tokens)
- Token calculation estimates ~4 tokens per word
- SSE streaming provides real-time message delivery
- All external API calls include proper error handling and logging
