# CometGameHouse Backend

Express.js backend with MongoDB integration and WebSocket (ws) for CometGameHouse.

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Create a `.env` file in the `Backend` directory. See `ENV_VARIABLES.md` for a complete list of environment variables.

   **Minimum required variables:**
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/cometgamehouse
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   FRONTEND_URL=http://localhost:5173
   API_URL=http://localhost:3000
   ```

   **For admin setup, also add:**
   ```env
   ADMIN_EMAIL=admin@comet.gg
   ADMIN_PASSWORD=Admin123!
   ADMIN_USERNAME=admin
   ADMIN_DISPLAY_NAME=Admin
   ```

   See `ENV_VARIABLES.md` for the complete reference.

3. (Optional) Create the first admin user:
   ```bash
   yarn seed:admin
   ```
   See `README_ADMIN_SETUP.md` for more details.

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
├── scripts/
│   └── seedAdmin.js         # Script to create initial admin user
├── ENV_VARIABLES.md         # Complete environment variables reference
├── README_ADMIN_SETUP.md    # Admin panel setup guide
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

