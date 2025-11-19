const BaseGameHandler = require('../BaseGameHandler');
const GameSession = require('../../models/GameSession');
const Room = require('../../models/Room');

/**
 * 5 Line Sheep Fight Game Handler
 * Handles game-specific logic for 5 Line Sheep Fight
 */
class FiveLineSheepFightHandler extends BaseGameHandler {
  constructor() {
    super('5-line-sheep-fight');
  }

  /**
   * Initialize game session
   */
  async initializeSession(sessionData) {
    const gameState = {
      board: this.createInitialBoard(),
      currentPlayer: 'player1',
      players: {
        player1: null,
        player2: null,
      },
      moves: [],
      status: 'waiting',
    };

    return {
      ...sessionData,
      gameState,
    };
  }

  /**
   * Create initial board state (empty board for 5 Line Sheep Fight)
   */
  createInitialBoard() {
    // 5 Line Sheep Fight typically uses a 15x15 or similar grid
    return {
      grid: Array(15).fill(null).map(() => Array(15).fill(null)),
      size: 15,
    };
  }

  /**
   * Process a game action
   */
  async processAction(action, sessionData) {
    const { type, data } = action;

    switch (type) {
      case 'place':
        return await this.handlePlace(data, sessionData);
      case 'block':
        return await this.handleBlock(data, sessionData);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  /**
   * Handle placing a sheep piece
   */
  async handlePlace(placeData, sessionData) {
    const { row, col } = placeData;

    // Validate placement
    const validation = await this.validatePlacement(placeData, sessionData);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid placement');
    }

    // Update board
    const newState = {
      ...sessionData.gameState,
      board: {
        ...sessionData.gameState.board,
        grid: sessionData.gameState.board.grid.map((r, i) =>
          i === row
            ? r.map((cell, j) => (j === col ? sessionData.gameState.currentPlayer : cell))
            : r
        ),
      },
      moves: [...sessionData.gameState.moves, placeData],
      currentPlayer: sessionData.gameState.currentPlayer === 'player1' ? 'player2' : 'player1',
    };

    // Check for 5 in a row
    const winner = this.checkFiveInRow(newState, row, col);
    if (winner) {
      newState.status = 'finished';
      newState.winner = winner;
    }

    return newState;
  }

  /**
   * Validate placement
   */
  async validatePlacement(placeData, sessionData) {
    const { row, col } = placeData;
    const { board } = sessionData.gameState;

    // Check if position is within bounds
    if (row < 0 || row >= board.size || col < 0 || col >= board.size) {
      return { valid: false, error: 'Position out of bounds' };
    }

    // Check if position is empty
    if (board.grid[row][col] !== null) {
      return { valid: false, error: 'Position already occupied' };
    }

    return { valid: true };
  }

  /**
   * Check for 5 in a row (win condition)
   */
  checkFiveInRow(gameState, row, col) {
    const { board, currentPlayer } = gameState;
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal \
      [1, -1],  // Diagonal /
    ];

    for (const [dx, dy] of directions) {
      let count = 1; // Count the current piece

      // Check in positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (
          newRow >= 0 && newRow < board.size &&
          newCol >= 0 && newCol < board.size &&
          board.grid[newRow][newCol] === currentPlayer
        ) {
          count++;
        } else {
          break;
        }
      }

      // Check in negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (
          newRow >= 0 && newRow < board.size &&
          newCol >= 0 && newCol < board.size &&
          board.grid[newRow][newCol] === currentPlayer
        ) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 5) {
        return currentPlayer;
      }
    }

    return null;
  }

  /**
   * Handle block move (if game supports blocking)
   */
  async handleBlock(blockData, sessionData) {
    // Implement block logic if needed
    return sessionData.gameState;
  }
}

module.exports = FiveLineSheepFightHandler;

