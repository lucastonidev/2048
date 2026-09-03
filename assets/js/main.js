import { Game2048 } from "./core/game.js";
import { ParticleNetwork } from "./core/particles.js"; // Importa a nova Classe OOP

const game = new Game2048();

class MainGame {
  constructor() {
    this.tileContainer = document.getElementById("tile-container");
    this.scoreEl = document.getElementById("score");
    this.bestScoreEl = document.getElementById("best-score");
    this.gameOverOverlay = document.getElementById("game-over-overlay");
    this.gameWonOverlay = document.getElementById("game-won-overlay");

    // Instancia o fundo animado (ele cuida de si mesmo agora)
    this.background = new ParticleNetwork("particle-canvas");

  }

  updateUI() {
    this.scoreEl.textContent = game.score;
    this.bestScoreEl.textContent = game.bestScore;

    if (game.gameOver) this.gameOverOverlay.classList.remove("hidden");
    else this.gameOverOverlay.classList.add("hidden");

    if (game.gameWon && !game.hasContinued)
      this.gameWonOverlay.classList.remove("hidden");
    else this.gameWonOverlay.classList.add("hidden");

    // === SOLUÇÃO DO BUG DO FANTASMA AQUI ===
    // 1. Pega os IDs das peças que devem existir AGORA na memória do jogo
    const currentTileIds = game.tiles.map((t) => `tile-${t.id}`);

    // 2. Transforma as peças HTML da tela numa lista
    const existingTiles = Array.from(this.tileContainer.children);

    // 3. O Pulo do Gato: Se a peça na tela não estiver na memória do jogo, destrua-a imediatamente!
    existingTiles.forEach((el) => {
      if (!currentTileIds.includes(el.id)) {
        el.remove();
      }
    });

    const gap = 12;

    // 4. Agora sim, desenha ou atualiza as peças que sobraram/nasceram
    game.tiles.forEach((tile) => {
      let div = document.getElementById(`tile-${tile.id}`);

      if (!div) {
        div = document.createElement("div");
        div.id = `tile-${tile.id}`;
        const inner = document.createElement("div");
        inner.className = "tile-inner";
        div.appendChild(inner);
        this.tileContainer.appendChild(div);
      }

      div.className = `tile tile-${tile.value > 2048 ? "super" : tile.value}`;
      div.firstChild.textContent = tile.value;
      div.style.transform = `translate(calc(${tile.c * 100}% + ${tile.c * gap}px), calc(${tile.r * 100}% + ${tile.r * gap}px))`;
    });
  }

  setupEventLister() {
    document.getElementById("btn-continue").addEventListener("click", () => {
      game.hasContinued = true;
      this.updateUI();
    });

    // Teclado (Travas removidas, jogo livre)
    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        let direction = e.key.replace("Arrow", "").toUpperCase();
        if (game.move(direction)) this.updateUI();
      }
    });

    // Swipe
    let touchStartX = 0;
    let touchStartY = 0;
    const gameBox = document.getElementById("game-container");

    gameBox.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      },
      { passive: false },
    );

    gameBox.addEventListener("touchmove", (e) => e.preventDefault(), {
      passive: false,
    });

    gameBox.addEventListener("touchend", (e) => {
      let touchEndX = e.changedTouches[0].screenX;
      let touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe(touchEndX - touchStartX, touchEndY - touchStartY);
    });
  }

  handleSwipe(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) {
        if (game.move(dx > 0 ? "RIGHT" : "LEFT")) this.updateUI();
      }
    } else {
      if (Math.abs(dy) > 30) {
        if (game.move(dy > 0 ? "DOWN" : "UP")) this.updateUI();
      }
    }
  }

  startGame() {
    this.tileContainer.innerHTML = "";

    game.init();
    this.updateUI();
  }

  init() {
    this.tileContainer.innerHTML = "";

    document
      .getElementById("btn-new-game")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("btn-retry")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("btn-won-new")
      .addEventListener("click", () => this.startGame());

    this.setupEventLister();
    this.startGame();
  }
}

document.addEventListener("DOMContentLoaded", () => new MainGame().init());
