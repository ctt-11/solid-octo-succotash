class Particle {
    constructor(x, y, mode) {
        this.x = x;
        this.y = y;
        this.mode = mode;
        this.reset();
    }

    reset() {
        const modes = {
            fire: {
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                life: 60 + Math.random() * 60,
                color: `hsl(${20 + Math.random() * 30}, 100%, ${50 + Math.random() * 30}%)`,
                size: 2 + Math.random() * 4,
                alpha: 1
            },
            water: {
                vx: (Math.random() - 0.5) * 1,
                vy: Math.random() * 2 + 1,
                life: 80 + Math.random() * 80,
                color: `hsl(${180 + Math.random() * 40}, 80%, ${40 + Math.random() * 30}%)`,
                size: 2 + Math.random() * 3,
                alpha: 0.8
            },
            snow: {
                vx: (Math.random() - 0.5) * 0.5,
                vy: Math.random() * 1 + 0.5,
                life: 100 + Math.random() * 100,
                color: `hsl(${200 + Math.random() * 30}, 80%, ${80 + Math.random() * 20}%)`,
                size: 2 + Math.random() * 3,
                alpha: 0.9
            },
            galaxy: {
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                life: 120 + Math.random() * 80,
                color: `hsl(${250 + Math.random() * 60}, 80%, ${50 + Math.random() * 40}%)`,
                size: 1 + Math.random() * 2,
                alpha: 0.7
            }
        };

        const config = modes[this.mode] || modes.fire;
        Object.assign(this, config);
        this.maxLife = this.life;
        this.originalColor = this.color;
    }

    update(gravity = 0.05) {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.mode === 'fire') {
            this.vy -= 0.02;
            this.vx += (Math.random() - 0.5) * 0.1;
        } else if (this.mode === 'water') {
            this.vy += gravity;
            this.vx += (Math.random() - 0.5) * 0.05;
        } else if (this.mode === 'snow') {
            this.vx += Math.sin(this.y * 0.05) * 0.05;
        } else if (this.mode === 'galaxy') {
            const angle = Math.atan2(this.y, this.x);
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.vx = Math.cos(angle + 0.02) * speed * 0.99;
            this.vy = Math.sin(angle + 0.02) * speed * 0.99;
        }

        this.life--;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        if (this.mode === 'fire') {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.mode === 'water') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.mode === 'snow') {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.mode === 'galaxy') {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mode = 'fire';
        this.particleSize = 3;
        this.particleCount = 500;
        this.speed = 1;
        this.gravity = 0.05;
        this.handPosition = null;
        this.handScale = 1;
    }

    setMode(mode) {
        this.mode = mode;
    }

    setParticleSize(size) {
        this.particleSize = size;
    }

    setParticleCount(count) {
        this.particleCount = count;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    setHandPosition(position, scale) {
        this.handPosition = position;
        this.handScale = scale;
    }

    emit(x, y, count = 1) {
        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 50;
            const particle = new Particle(x + offsetX, y + offsetY, this.mode);
            particle.size *= this.particleSize / 3;
            this.particles.push(particle);
        }
    }

    update() {
        if (this.handPosition) {
            const emitCount = Math.floor(3 * this.handScale * this.speed);
            this.emit(this.handPosition.x, this.handPosition.y, emitCount);
        }

        this.particles = this.particles.filter(p => !p.isDead());
        
        while (this.particles.length > this.particleCount) {
            this.particles.shift();
        }

        this.particles.forEach(p => {
            p.vx *= this.speed;
            p.vy *= this.speed;
            p.update(this.gravity);
        });
    }

    draw() {
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => p.draw(this.ctx));
    }

    getParticleCount() {
        return this.particles.length;
    }
}

export { ParticleSystem };