// fireworkEngine.js

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;

    this.radius = Math.random() * 2 + 1;
    this.velocity = {
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
    };

    this.alpha = 1;
    this.gravity = 0.08;
    this.friction = 0.98;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.globalCompositeOperation = "lighter";

    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius * 2
    );

    gradient.addColorStop(0, `rgba(255,255,255,${this.alpha})`);
    gradient.addColorStop(0.4, `rgba(${this._rgb()},${this.alpha})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _rgb() {
    const hsl = this.color.match(/\d+/g);
    if (!hsl) return "255,255,255";

    const [h, s, l] = hsl.map(Number);

    const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l / 100 - c / 2;

    let r = 0,
      g = 0,
      b = 0;
    if (h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return `${Math.round((r + m) * 255)}, ${Math.round(
      (g + m) * 255
    )}, ${Math.round((b + m) * 255)}`;
  }

  update(wind) {
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.velocity.y += this.gravity + (wind?.y || 0);
    this.velocity.x += wind?.x || 0;

    this.x += this.velocity.x;
    this.y += this.velocity.y;

    this.alpha -= 0.003;
    this.radius += 0.02;
  }
}

class CanvasFirework {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    const palettes = [
      [0, 60, 120, 180, 240, 300],
      [10, 25, 40, 55, 70, 85],
      [180, 200, 220, 260, 280, 320],
      Array.from({ length: 12 }, (_, i) => i * 30),
      Array.from({ length: 24 }, (_, i) => i * 15),
    ];

    this.palette = palettes[Math.floor(Math.random() * palettes.length)];
    this.color = `hsl(${
      this.palette[Math.floor(Math.random() * this.palette.length)]
    }, 100%, 50%)`;

    this.particles = [];
    this.launchPhase = true;
    this.rocketY = window.innerHeight;
    this.targetY = y;
    this.speed = Math.random() * 5 + 8;
    this.wind = { x: (Math.random() - 0.5) * 0.2, y: -0.02 };
  }

  update() {
    if (this.launchPhase) {
      this.rocketY -= this.speed;
      if (this.rocketY <= this.targetY) {
        this._explode();
      }
      return true;
    }

    this.particles = this.particles.filter((particle) => {
      particle.update(this.wind);
      return particle.alpha > 0;
    });

    return this.particles.length > 0;
  }

  _explode() {
    this.launchPhase = false;

    for (let i = 0; i < 180; i++) {
      const hue = this.palette[Math.floor(Math.random() * this.palette.length)];
      const lightness = 45 + Math.random() * 30;
      const color = `hsl(${hue}, 100%, ${lightness}%)`;

      const particle = new Particle(this.x, this.rocketY, color);
      const angle = (i / 180) * Math.PI * 2;
      const speed = Math.random() * 4 + 2;

      particle.velocity.x = Math.cos(angle) * speed;
      particle.velocity.y = Math.sin(angle) * speed;

      this.particles.push(particle);
    }
  }

  draw(ctx) {
    if (this.launchPhase) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.rocketY + 20);
      ctx.lineTo(this.x, this.rocketY + 5);
      ctx.strokeStyle = "rgba(255,165,0,0.8)";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.x, this.rocketY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();
    } else {
      this.particles.forEach((p) => p.draw(ctx));
    }
  }
}

export default CanvasFirework;
