# CometGameHouse Backend

Express.js backend with MongoDB integration and WebSocket (ws) for CometGameHouse.

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string.

4. Start the development server:
```bash
yarn dev
```

Or start the production server:
```bash
yarn start
```

## Project Structure

```
.
├── app/
│   ├── config/
│   │   └── database.js      # (Legacy - can be removed)
│   ├── models/
│   │   └── User.js          # Example User model
│   ├── routes/
│   │   └── index.js         # API routes
│   └── services/
│       ├── databaseService.js    # MongoDB connection service
│       ├── mainAPIService.js     # Express API service
│       └── socketService.js      # WebSocket service (ws)
├── server.js                # Main server file (imports all services)
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore file
└── package.json            # Project dependencies

```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint

## Services

The application is split into 3 main services:

1. **Database Service** (`app/services/databaseService.js`)
   - Handles MongoDB connection
   - Database: `cometgamehouse`
   - Provides connect/disconnect functions

2. **Main API Service** (`app/services/mainAPIService.js`)
   - Sets up Express application
   - Configures middleware and routes
   - Handles error handling

3. **Socket Service** (`app/services/socketService.js`)
   - Sets up WebSocket server using `ws` module
   - Handles real-time connections
   - Manages WebSocket events
   - WebSocket endpoint: `ws://localhost:PORT/ws`

## Technologies

- Express.js
- MongoDB (via Mongoose)
- WebSocket (ws module)
- dotenv

