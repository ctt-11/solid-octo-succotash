class HandTracker {
    constructor(videoElement, canvasElement) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.hands = null;
        this.onHandDetected = null;
        this.isRunning = false;
        this.lastLandmarks = null;
    }

    async initialize() {
        this.hands = new window.mediapipe.solutions.hands.Hands({
            staticImageMode: false,
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onResults.bind(this));

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            this.videoElement.srcObject = stream;
            this.videoElement.onloadedmetadata = () => {
                this.startDetection();
            };
        } catch (error) {
            console.error('无法访问摄像头:', error);
            throw error;
        }
    }

    onResults(results) {
        this.lastLandmarks = results.multiHandLandmarks;
        this.lastWorldLandmarks = results.multiHandWorldLandmarks;
        
        if (this.onHandDetected && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const worldLandmarks = results.multiHandWorldLandmarks ? results.multiHandWorldLandmarks[0] : null;
            
            this.onHandDetected({
                landmarks: landmarks,
                worldLandmarks: worldLandmarks,
                handedness: results.multiHandedness ? results.multiHandedness[0].label : 'Right'
            });
        }

        this.drawResults(results);
    }

    drawResults(results) {
        this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                this.drawHand(landmarks);
            }
        }
    }

    drawHand(landmarks) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20]
        ];

        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;

        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x * this.canvasElement.width, startPoint.y * this.canvasElement.height);
            this.ctx.lineTo(endPoint.x * this.canvasElement.width, endPoint.y * this.canvasElement.height);
            this.ctx.stroke();
        });

        landmarks.forEach(landmark => {
            const x = landmark.x * this.canvasElement.width;
            const y = landmark.y * this.canvasElement.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }

    startDetection() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.processVideo();
    }

    processVideo() {
        if (!this.isRunning || !this.videoElement || !this.hands) return;

        if (this.videoElement.readyState === 4) {
            this.hands.send({ image: this.videoElement });
        }

        requestAnimationFrame(() => this.processVideo());
    }

    stop() {
        this.isRunning = false;
        if (this.hands) {
            this.hands.close();
        }
        if (this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
    }

    getLastLandmarks() {
        return this.lastLandmarks;
    }
}

export { HandTracker };