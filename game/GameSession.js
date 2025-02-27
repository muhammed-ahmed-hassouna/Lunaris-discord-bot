class GameSession {
  constructor(player1, player2, imagePair) {
    this.players = [player1, player2];
    this.images = {
      [player1.id]: imagePair[0],
      [player2.id]: imagePair[1],
    };
    this.currentTurn = player1.id;
    this.moveHistory = [];
    this.viewersChannelId = null;
    this.startTime = null;
    this.endTime = null;
    this.actions = [];
    this.winner = null;
    this.id = null;
  }

  addAction(action) {
    this.actions.push({
      timestamp: Date.now(),
      action,
    });
  }
  addMove(move) {
    this.moveHistory.push({
      ...move,
      timestamp: Date.now(),
    });
  }

  setWinner(playerId) {
    this.winner = playerId;
    this.endTime = Date.now();
  }

  nextTurn() {
    this.currentPlayer =
      this.currentPlayer === this.player1 ? this.player2 : this.player1;

    // Log turn change
    gameManager.logGameAction(
        this.client,
        this.id,
        `🔄 تم تبديل الدور إلى ${this.currentPlayer.tag}`
      );
      
  }
}

module.exports = GameSession;
