class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.video = document.getElementById('video');
        this.gestureDisplay = document.getElementById('gesture-display');
        this.particleCountDisplay = document.getElementById('particle-count');
        
        this.particleSystem = null;
        this.handTracker = null;
        this.gestureRecognizer = null;
        
        this.currentMode = 'fire';
        this.particleSize = 3;
        this.particleCount = 500;
        this.speed = 1;
        
        this.setupCanvas();
        this.setupControls();
        this.init();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.particleSystem) {
            this.particleSystem.canvas = this.canvas;
            this.particleSystem.ctx = this.canvas.getContext('2d');
        }
    }

    setupControls() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMode = e.target.dataset.mode;
                if (this.particleSystem) {
                    this.particleSystem.setMode(this.currentMode);
                }
            });
        });

        const sizeSlider = document.getElementById('particle-size');
        const sizeValue = document.getElementById('particle-size-value');
        sizeSlider.addEventListener('input', (e) => {
            this.particleSize = parseInt(e.target.value);
            sizeValue.textContent = this.particleSize;
            if (this.particleSystem) {
                this.particleSystem.setParticleSize(this.particleSize);
            }
        });

        const countSlider = document.getElementById('particle-count-slider');
        const countValue = document.getElementById('particle-count-value');
        countSlider.addEventListener('input', (e) => {
            this.particleCount = parseInt(e.target.value);
            countValue.textContent = this.particleCount;
            if (this.particleSystem) {
                this.particleSystem.setParticleCount(this.particleCount);
            }
        });

        const speedSlider = document.getElementById('speed');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            speedValue.textContent = this.speed;
            if (this.particleSystem) {
                this.particleSystem.setSpeed(this.speed);
            }
        });
    }

    async init() {
        this.particleSystem = new ParticleSystem(this.canvas);
        this.gestureRecognizer = new GestureRecognizer();
        
        try {
            this.handTracker = new HandTracker(this.video, this.canvas);
            this.handTracker.onHandDetected = (data) => {
                this.handleHandDetected(data);
            };
            await this.handTracker.initialize();
        } catch (error) {
            console.error('初始化失败:', error);
            this.gestureDisplay.textContent = '无法访问摄像头';
        }
        
        this.gameLoop();
    }

    handleHandDetected(data) {
        const result = this.gestureRecognizer.recognize(data.landmarks);
        
        this.gestureDisplay.textContent = this.gestureRecognizer.getGestureName(result.gesture);
        
        if (result.position) {
            const x = result.position.x * this.canvas.width;
            const y = result.position.y * this.canvas.height;
            this.particleSystem.setHandPosition({ x, y }, result.scale);
        }
    }

    gameLoop() {
        if (this.particleSystem) {
            this.particleSystem.update();
            this.particleSystem.draw();
            this.particleCountDisplay.textContent = `粒子数: ${this.particleSystem.getParticleCount()}`;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    destroy() {
        if (this.handTracker) {
            this.handTracker.stop();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.destroy();
    }
});