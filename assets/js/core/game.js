export class Game2048 {
  constructor() {
    this.size = 4;
    this.board = [];
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem("2048-best-score")) || 0;
    this.gameOver = false;
    this.gameWon = false;
    this.hasContinued = false;
    this.tiles = [];
    this.tileIdCounter = Date.now();
  }

  init() {
    this.board = Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill(0));
    this.tiles = [];
    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.hasContinued = false;
    this.addRandomTile();
    this.addRandomTile();
  }

  addRandomTile() {
    let emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return;

    let { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    let value = Math.random() < 0.9 ? 2 : 4;
    let id = this.tileIdCounter++;

    this.board[r][c] = id;
    this.tiles.push({ id, value, r, c });
  }

  move(direction) {
    if (this.gameOver || (this.gameWon && !this.hasContinued)) return false;
    let moved = false;

    const traverse =
      direction === "RIGHT" || direction === "DOWN"
        ? [3, 2, 1, 0]
        : [0, 1, 2, 3];

    let mergedThisTurn = [];

    for (let i = 0; i < this.size; i++) {
      for (let j of traverse) {
        let r = direction === "UP" || direction === "DOWN" ? j : i;
        let c = direction === "LEFT" || direction === "RIGHT" ? j : i;

        let tileId = this.board[r][c];
        if (tileId === 0) continue;

        let nextR = r;
        let nextC = c;

        while (true) {
          let tempR =
            nextR + (direction === "UP" ? -1 : direction === "DOWN" ? 1 : 0);
          let tempC =
            nextC + (direction === "LEFT" ? -1 : direction === "RIGHT" ? 1 : 0);

          if (
            tempR < 0 ||
            tempR >= this.size ||
            tempC < 0 ||
            tempC >= this.size
          )
            break;

          let nextTileId = this.board[tempR][tempC];
          if (nextTileId !== 0) {
            let currentTile = this.tiles.find((t) => t.id === tileId);
            let nextTile = this.tiles.find((t) => t.id === nextTileId);

            if (
              currentTile.value === nextTile.value &&
              !mergedThisTurn.includes(nextTileId)
            ) {
              // Merge
              nextR = tempR;
              nextC = tempC;
              currentTile.value *= 2;
              this.score += currentTile.value;
              this.tiles = this.tiles.filter((t) => t.id !== nextTileId);
              mergedThisTurn.push(tileId);
              moved = true;
            }
            break;
          }
          nextR = tempR;
          nextC = tempC;
          moved = true;
        }

        if (nextR !== r || nextC !== c) {
          this.board[r][c] = 0;
          this.board[nextR][nextC] = tileId;
          let tile = this.tiles.find((t) => t.id === tileId);
          tile.r = nextR;
          tile.c = nextC;
        }
      }
    }

    if (moved) {
      this.updateBestScore();
      this.addRandomTile();
      this.checkState();
    }
    return moved;
  }

  updateBestScore() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("2048-best-score", this.bestScore);
    }
  }

  checkState() {
    // Vitória
    if (!this.gameWon && this.tiles.some((t) => t.value === 2048)) {
      this.gameWon = true;
    }

    // Fim de Jogo (tabuleiro cheio sem movimentos adjacentes)
    if (this.tiles.length === this.size * this.size) {
      let possibleMove = false;
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          let tileId = this.board[r][c];
          let val = this.tiles.find((t) => t.id === tileId).value;
          if (
            (r < this.size - 1 &&
              val ===
                this.tiles.find((t) => t.id === this.board[r + 1][c])?.value) ||
            (c < this.size - 1 &&
              val ===
                this.tiles.find((t) => t.id === this.board[r][c + 1])?.value)
          ) {
            possibleMove = true;
          }
        }
      }
      if (!possibleMove) this.gameOver = true;
    }
  }
}
