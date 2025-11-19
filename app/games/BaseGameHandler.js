/**
 * Base Game Handler
 * All game-specific handlers should extend this class
 */
class BaseGameHandler {
  constructor(gameSlug) {
    this.gameSlug = gameSlug;
  }

  /**
   * Initialize game session
   * Called when players join a game
   */
  async initializeSession(sessionData) {
    // Override in game-specific handler
    return sessionData;
  }

  /**
   * Process game action (move, turn, etc.)
   * Called when player sends a game action
   */
  async processAction(action, sessionData) {
    // Override in game-specific handler
    throw new Error('processAction must be implemented by game handler');
  }

  /**
   * Validate game action
   */
  async validateAction(action, sessionData) {
    // Override in game-specific handler
    return { valid: true };
  }

  /**
   * Get game state for a session
   */
  async getGameState(sessionId) {
    // Override in game-specific handler
    return null;
  }

  /**
   * Cleanup when game ends
   */
  async endGame(sessionId, result) {
    // Override in game-specific handler
    return result;
  }

  /**
   * Broadcast game state update to players
   */
  broadcastGameState(sessionId, gameState) {
    if (global.broadcastToAll) {
      global.broadcastToAll('game-state-update', {
        gameSlug: this.gameSlug,
        sessionId,
        gameState,
      });
    }
  }
}

module.exports = BaseGameHandler;

