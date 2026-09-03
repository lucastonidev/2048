class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.targetX = null;
    this.targetY = null;
    this.isArrived = false;
  }

  update(isFormingShape) {
    if (isFormingShape && this.targetX !== null) {
      if (this.isArrived) return;

      let dx = this.targetX - this.x;
      let dy = this.targetY - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 4) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isArrived = true;
      } else {
        let moveX = dx * 0.08;
        let moveY = dy * 0.08;

        if (Math.abs(moveX) < 0.5 && moveX !== 0)
          moveX = Math.sign(moveX) * 0.5;
        if (Math.abs(moveY) < 0.5 && moveY !== 0)
          moveY = Math.sign(moveY) * 0.5;

        this.x += moveX;
        this.y += moveY;
      }
    } else {
      // Movimento livre e reset de alvos
      this.isArrived = false;
      this.targetX = null;
      this.targetY = null;

      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = this.isArrived ? "#fff" : "#e879f9";
    ctx.fill();
  }
}

export class ParticleNetwork {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.shapesData = null;
    this.targetPoints = [];
    this.isFormingShape = false;

    this.init();
  }

  async init() {
    this.resize();
    window.addEventListener("resize", () => this.resize());

    for (let i = 0; i < 150; i++) {
      this.particles.push(new Particle(this.canvas));
    }

    try {
      const response = await fetch("./assets/js/data/shapes.json");
      this.shapesData = await response.json();

      // Inicia a vida autônoma do fundo
      this.startRandomLoop();
    } catch (err) {
      console.error("Erro ao carregar shapes.json:", err);
    }

    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Recalcula o tamanho do desenho imediatamente se girar o celular
    if (this.isFormingShape) {
      this.assignTargets("gata");
    }
  }

  calculateAdaptivePoints(shapeName) {
    if (!this.shapesData || !this.shapesData[shapeName]) return [];

    const scale = Math.min(this.canvas.width, this.canvas.height) * 0.35;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    return this.shapesData[shapeName].map((pt) => ({
      x: centerX + pt.x * scale,
      y: centerY + pt.y * scale,
      break: pt.break || false,
    }));
  }

  assignTargets(shapeName) {
    this.targetPoints = this.calculateAdaptivePoints(shapeName);
    this.particles.forEach((p, index) => {
      if (index < this.targetPoints.length) {
        p.targetX = this.targetPoints[index].x;
        p.targetY = this.targetPoints[index].y;
        p.isArrived = false;
      } else {
        p.targetX = null;
        p.targetY = null;
        p.isArrived = false;
      }
    });
  }

  triggerShape(shapeName, durationInSeconds = 8) {
    this.isFormingShape = true;
    this.assignTargets(shapeName);

    // O desenho se desfaz automaticamente após a duração
    setTimeout(() => {
      this.isFormingShape = false;
    }, durationInSeconds * 1000);
  }

  startRandomLoop() {
    // Faz a primeira aparição com 5 segundos de jogo
    setTimeout(() => this.triggerShape("gata"), 5000);

    // Depois, entra num loop para aparecer em tempos aleatórios (entre 30s e 50s)
    const loop = () => {
      const nextInterval = Math.random() * 20000 + 30000;
      setTimeout(() => {
        this.triggerShape("gata");
        loop();
      }, nextInterval);
    };
    loop();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Atualiza e desenha as partículas
    this.particles.forEach((p) => {
      p.update(this.isFormingShape);
      p.draw(this.ctx);
    });

    // Conecta a teia solta no fundo
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        let p1 = this.particles[i];
        let p2 = this.particles[j];

        // Se estiver desenhando a gata, ignora as partículas que compõem o rosto para não borrar
        if (
          this.isFormingShape &&
          (p1.targetX !== null || p2.targetX !== null)
        ) {
          continue;
        }

        let dx = p1.x - p2.x;
        let dy = p1.y - p2.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 90) {
          this.ctx.beginPath();
          let alpha = (1 - distance / 90) * 0.4;
          this.ctx.strokeStyle = `rgba(147, 51, 234, ${alpha})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Desenha o contorno da gata conectando a ordem correta dos pontos
    if (this.isFormingShape && this.targetPoints.length > 0) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = "rgba(147, 51, 234, 1)";
      this.ctx.lineWidth = 1.5;

      for (let i = 0; i < this.targetPoints.length - 1; i++) {
        let p1 = this.particles[i];
        let p2 = this.particles[i + 1];

        if (p1 && p2 && p1.isArrived && p2.isArrived) {
          if (!this.targetPoints[i + 1].break) {
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
          }
        }
      }
      this.ctx.stroke();
    }

    requestAnimationFrame(() => this.animate());
  }
}
