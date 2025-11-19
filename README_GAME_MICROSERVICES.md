# Game Microservices Architecture

This document explains the microservices architecture for game servers.

## Overview

Each game runs on its **own separate server** with a different port. The main server acts as a **gateway/proxy** that forwards game action requests to the appropriate game server.

## Architecture

```
┌─────────────────┐
│   Main Server   │  (Port 3000)
│   (Gateway)     │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┬──────────────┐
         │                 │                 │              │
         ▼                 ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Game Server 1│  │ Game Server 2│  │ Game Server 3│  │ Game Server N│
│ (Port 3001)  │  │ (Port 3002)  │  │ (Port 3003)  │  │ (Port 300N)  │
│ Animal Chess │  │ 5 Line Sheep │  │  Tic Tac Toe │  │   ...        │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

## Benefits

✅ **No Main Server Restart** - Add new games without restarting the main server  
✅ **Independent Deployment** - Each game can be deployed/updated separately  
✅ **Independent Scaling** - Scale each game server based on load  
✅ **Technology Freedom** - Each game can use different tech stack  
✅ **Fault Isolation** - If one game server crashes, others continue working  
✅ **Development Isolation** - Game developers can work independently  

## How It Works

### 1. Admin Adds Game

When an admin adds a new game via the admin panel, they provide:
- **Game Server URL**: `http://localhost:3001` (where the game's backend runs)
- **Component URL**: `http://localhost:3001/component.js` (optional, for frontend component)

### 2. Main Server Proxies Requests

When a player sends a game action:
1. Frontend sends: `POST /api/games/{slug}/action`
2. Main server looks up the game's `gameServerUrl` from database
3. Main server forwards the request to: `{gameServerUrl}/api/action`
4. Game server processes the action and returns result
5. Main server returns the result to frontend

### 3. Game Server Requirements

Each game server must implement these endpoints:

#### POST `/api/action`
Process a game action (move, turn, etc.)

**Request:**
```json
{
  "action": {
    "type": "move",
    "data": { ... }
  },
  "sessionData": {
    "sessionId": "...",
    "userId": "...",
    "gameSlug": "...",
    "roomId": "...",
    "status": "playing",
    "gameState": { ... }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gameState": { ... }
  }
}
```

#### GET `/api/state`
Get current game state

**Headers:**
- `Authorization`: Bearer token (forwarded from main server)
- `X-User-Id`: User ID
- `X-Session-Id`: Session ID

**Response:**
```json
{
  "success": true,
  "data": {
    "gameState": { ... }
  }
}
```

## Implementation Steps

### Step 1: Create Game Server

Create a new Node.js server for your game:

```javascript
// game-server-animal-chess/server.js
const express = require('express');
const app = express();

app.use(express.json());

// Game action endpoint
app.post('/api/action', async (req, res) => {
  const { action, sessionData } = req.body;
  
  // Process game action
  const newGameState = processGameAction(action, sessionData);
  
  res.json({
    success: true,
    data: { gameState: newGameState }
  });
});

// Get game state endpoint
app.get('/api/state', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const gameState = await getGameState(sessionId);
  
  res.json({
    success: true,
    data: { gameState }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Animal Chess game server running on port ${PORT}`);
});
```

### Step 2: Add Game via Admin Panel

1. Go to Admin → Games
2. Click "Add New Game"
3. Fill in:
   - **Slug**: `animal-chess`
   - **Title**: `Animal Chess`
   - **Game Server URL**: `http://localhost:3001`
   - **Component URL**: `http://localhost:3001/component.js` (optional)
   - Other game metadata...
4. Save

### Step 3: Start Game Server

```bash
cd game-server-animal-chess
node server.js
```

### Step 4: Test

The main server will automatically proxy requests to your game server. No restart needed!

## Main Server Implementation

The main server's `gameActionController.js` handles proxying:

```javascript
// Main server receives: POST /api/games/animal-chess/action
// 1. Looks up game.gameServerUrl from database
// 2. Forwards to: http://localhost:3001/api/action
// 3. Returns game server's response
```

## Game Server URL Format

- **Development**: `http://localhost:3001`
- **Production**: `https://animal-chess.example.com`
- **Docker**: `http://animal-chess-service:3001`

## Error Handling

If a game server is unavailable:
- Main server returns: `503 Service Unavailable`
- Error message: `"Game server is unavailable: {url}"`
- Frontend can handle this gracefully

## Security

- Main server forwards the `Authorization` header to game servers
- Game servers should validate the token
- Main server passes `X-User-Id` and `X-Session-Id` headers
- Game servers should validate user permissions

## Database

The `Game` model includes:
- `gameServerUrl`: URL to the game's backend server
- `componentUrl`: URL to the game's frontend component (optional)

## Frontend Integration

Frontend doesn't need to know about game servers. It always calls:
- `POST /api/games/{slug}/action`
- `GET /api/games/{slug}/state`

The main server handles routing to the correct game server.

## Example: Adding a New Game

1. **Create game server** (separate project)
   ```bash
   mkdir game-server-tic-tac-toe
   cd game-server-tic-tac-toe
   npm init
   # Create server.js with /api/action and /api/state endpoints
   ```

2. **Start game server**
   ```bash
   node server.js  # Runs on port 3002
   ```

3. **Add game via admin panel**
   - Slug: `tic-tac-toe`
   - Game Server URL: `http://localhost:3002`
   - Component URL: `http://localhost:3002/component.js`

4. **Done!** No main server restart needed.

## Migration from Handler-Based System

If you have existing games using the handler system:
- They can continue working (if `gameServerUrl` is not set)
- Or migrate them to separate servers
- Or keep both systems (handler for simple games, microservice for complex ones)

## Best Practices

1. **Health Checks**: Game servers should implement `/health` endpoint
2. **Logging**: Log all game actions for debugging
3. **Rate Limiting**: Implement rate limiting on game servers
4. **Validation**: Validate all actions before processing
5. **State Management**: Store game state in database or cache
6. **WebSocket**: Game servers can have their own WebSocket for real-time updates

## Troubleshooting

### Game server not responding
- Check if game server is running
- Verify `gameServerUrl` is correct in database
- Check firewall/network settings
- Verify game server is listening on correct port

### CORS errors
- Game servers should allow requests from main server
- Or main server can handle CORS and forward requests

### Authentication issues
- Ensure game servers validate the forwarded `Authorization` header
- Or game servers can trust requests from main server (internal network)

## Summary

✅ Each game = Separate server  
✅ Admin adds `gameServerUrl` when creating game  
✅ Main server proxies requests automatically  
✅ No restart needed when adding games  
✅ Games are completely independent  

This architecture provides maximum flexibility and scalability!

