const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store user connections: userId -> Set of WebSocket connections
const userConnections = new Map();

const createSocketService = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true,
    perMessageDeflate: false, // Disable compression to avoid issues
  });

  wss.on('connection', async (ws, req) => {
    let userId = null;
    let user = null;
    const connectionId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    console.log(`[WS ${connectionId}] Connection attempt from: ${req.socket.remoteAddress}`);
    console.log(`[WS ${connectionId}] URL: ${req.url}`);
    console.log(`[WS ${connectionId}] Headers:`, JSON.stringify(req.headers, null, 2));

    // Authenticate user from token in query or headers
    try {
      // Parse token from URL query string (simple approach)
      let token = null;
      if (req.url) {
        const urlMatch = req.url.match(/[?&]token=([^&]+)/);
        if (urlMatch) {
          token = decodeURIComponent(urlMatch[1]);
          console.log(`[WS ${connectionId}] Token found in URL (length: ${token.length})`);
        } else {
          console.log(`[WS ${connectionId}] No token in URL`);
        }
      }
      
      // Fallback to Authorization header
      if (!token) {
        token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          console.log(`[WS ${connectionId}] Token found in Authorization header (length: ${token.length})`);
        }
      }
      
      if (token) {
        try {
          console.log(`[WS ${connectionId}] Verifying JWT token...`);
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log(`[WS ${connectionId}] JWT decoded:`, { userId: decoded.userId, id: decoded.id, iat: decoded.iat, exp: decoded.exp });
          
          // JWT contains userId, not id (check auth middleware for reference)
          const tokenUserId = decoded.userId || decoded.id;
          if (!tokenUserId) {
            console.warn(`[WS ${connectionId}] ❌ Token does not contain userId`);
            ws.close(1008, 'Invalid token format');
            return;
          }
          
          console.log(`[WS ${connectionId}] Looking up user: ${tokenUserId}`);
          user = await User.findById(tokenUserId).select('-password');
          
          if (user) {
            userId = user._id.toString();
            ws.userId = userId;
            ws.connectionId = connectionId;
            
            // Store connection
            if (!userConnections.has(userId)) {
              userConnections.set(userId, new Set());
            }
            userConnections.get(userId).add(ws);
            
            const connectionTime = Date.now() - startTime;
            console.log(`[WS ${connectionId}] ✅ Authenticated user connected: ${userId} (${user.displayName}) in ${connectionTime}ms`);
            console.log(`[WS ${connectionId}] Total connections for user: ${userConnections.get(userId).size}`);
            
            // Send welcome message
            try {
              ws.send(JSON.stringify({ 
                type: 'connected', 
                message: 'Welcome to CometGameHouse WebSocket',
                authenticated: true,
              }));
              console.log(`[WS ${connectionId}] Welcome message sent`);
            } catch (sendError) {
              console.error(`[WS ${connectionId}] Error sending welcome message:`, sendError.message);
            }
          } else {
            console.warn(`[WS ${connectionId}] ❌ User not found for userId: ${tokenUserId}`);
            ws.close(1008, 'User not found');
            return;
          }
        } catch (jwtError) {
          console.error(`[WS ${connectionId}] ❌ JWT verification error:`, {
            name: jwtError.name,
            message: jwtError.message,
            expiredAt: jwtError.expiredAt,
          });
          ws.close(1008, `Invalid token: ${jwtError.message}`);
          return;
        }
      } else {
        console.warn(`[WS ${connectionId}] ❌ No token provided in WebSocket connection`);
        ws.close(1008, 'Authentication required');
        return;
      }
    } catch (error) {
      console.error(`[WS ${connectionId}] ❌ WebSocket authentication error:`, {
        message: error.message,
        stack: error.stack,
      });
      ws.close(1011, `Server error: ${error.message}`);
      return;
    }

    ws.on('message', (message) => {
      const connId = ws.connectionId || connectionId;
      try {
        const data = JSON.parse(message.toString());
        console.log(`[WS ${connId}] Message received:`, data);
        
        // Handle ping/pong for keepalive
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          console.log(`[WS ${connId}] Pong sent`);
          return;
        }
      } catch (error) {
        console.error(`[WS ${connId}] Error parsing message:`, error.message);
      }
    });

    ws.on('close', (code, reason) => {
      const connId = ws.connectionId || connectionId;
      const connectionDuration = Date.now() - startTime;
      const reasonStr = reason?.toString() || 'none';
      
      console.log(`[WS ${connId}] 🔌 Connection closed:`, {
        userId: userId || 'anonymous',
        code,
        reason: reasonStr,
        duration: `${connectionDuration}ms`,
        wasClean: code === 1000,
      });
      
      // Clean up connection
      if (userId && userConnections.has(userId)) {
        userConnections.get(userId).delete(ws);
        const remaining = userConnections.get(userId).size;
        console.log(`[WS ${connId}] Remaining connections for user ${userId}: ${remaining}`);
        if (remaining === 0) {
          userConnections.delete(userId);
          console.log(`[WS ${connId}] Removed user ${userId} from connections map`);
        }
      }
      
      // Log common close codes
      const closeCodeMessages = {
        1000: 'Normal closure',
        1001: 'Going away',
        1006: 'Abnormal closure (no close frame) - Network issue, server crash, or connection closed before handshake',
        1008: 'Policy violation',
        1011: 'Internal server error',
      };
      if (closeCodeMessages[code]) {
        console.log(`[WS ${connId}] Close code ${code} means: ${closeCodeMessages[code]}`);
      }
      
      // Special handling for 1006 (abnormal closure)
      if (code === 1006) {
        console.warn(`[WS ${connId}] ⚠️ Abnormal closure detected. Possible causes:`);
        console.warn(`  - Network interruption`);
        console.warn(`  - Server restart/crash`);
        console.warn(`  - Connection timeout`);
        console.warn(`  - Proxy/firewall blocking`);
        console.warn(`  - Client closed browser/tab`);
      }
    });

    ws.on('error', (error) => {
      const connId = ws.connectionId || connectionId;
      console.error(`[WS ${connId}] ❌ WebSocket error:`, {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
    });

    // Send periodic ping to keep connection alive and detect dead connections
    let pingInterval = null;
    let pongTimeout = null;
    const PING_INTERVAL = 25000; // 25 seconds
    const PONG_TIMEOUT = 5000; // 5 seconds

    const startPingPong = () => {
      if (ws.readyState !== 1) return; // Only if OPEN

      pingInterval = setInterval(() => {
        if (ws.readyState === 1) { // OPEN
          try {
            ws.ping();
            console.log(`[WS ${ws.connectionId || connectionId}] 📤 Ping sent`);
            
            // Set timeout for pong response
            pongTimeout = setTimeout(() => {
              console.warn(`[WS ${ws.connectionId || connectionId}] ⚠️ No pong received, closing connection`);
              ws.terminate(); // Force close if no pong
            }, PONG_TIMEOUT);
          } catch (error) {
            console.error(`[WS ${ws.connectionId || connectionId}] Error sending ping:`, error.message);
          }
        } else {
          clearInterval(pingInterval);
          if (pongTimeout) clearTimeout(pongTimeout);
        }
      }, PING_INTERVAL);
    };

    // Handle pong response
    ws.on('pong', () => {
      const connId = ws.connectionId || connectionId;
      console.log(`[WS ${connId}] 📥 Pong received`);
      if (pongTimeout) {
        clearTimeout(pongTimeout);
        pongTimeout = null;
      }
    });

    // Start ping/pong only after successful authentication
    if (userId) {
      startPingPong();
    }

    // Monitor connection state (less frequent, just for logging)
    const stateCheckInterval = setInterval(() => {
      const connId = ws.connectionId || connectionId;
      if (ws.readyState === 1) { // OPEN
        console.log(`[WS ${connId}] 💚 Connection healthy (OPEN)`);
      } else if (ws.readyState === 2) { // CLOSING
        console.log(`[WS ${connId}] ⚠️ Connection closing...`);
      } else if (ws.readyState === 3) { // CLOSED
        console.log(`[WS ${connId}] ❌ Connection closed`);
        clearInterval(stateCheckInterval);
        if (pingInterval) clearInterval(pingInterval);
        if (pongTimeout) clearTimeout(pongTimeout);
      }
    }, 60000); // Check every 60 seconds

    // Clean up intervals on close
    ws.on('close', () => {
      clearInterval(stateCheckInterval);
      if (pingInterval) clearInterval(pingInterval);
      if (pongTimeout) clearTimeout(pongTimeout);
    });
  });

  // Helper function to send notification to a specific user
  const sendNotificationToUser = (targetUserId, notification) => {
    const connections = userConnections.get(targetUserId);
    if (connections) {
      const message = JSON.stringify({
        type: 'notification',
        data: notification,
      });
      
      connections.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(message);
        }
      });
    }
  };

  // Helper function to broadcast message to all connected users
  const broadcastToAll = (messageType, data) => {
    const message = JSON.stringify({
      type: messageType,
      data: data,
    });

    let sentCount = 0;
    userConnections.forEach((connections) => {
      connections.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          try {
            ws.send(message);
            sentCount++;
          } catch (error) {
            console.error('Error broadcasting message:', error);
          }
        }
      });
    });

    console.log(`Broadcasted ${messageType} to ${sentCount} connected users`);
    return sentCount;
  };

  return { wss, sendNotificationToUser, broadcastToAll };
};

module.exports = createSocketService;

