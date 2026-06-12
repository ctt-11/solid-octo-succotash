class GestureRecognizer {
    constructor() {
        this.previousGesture = null;
        this.gestureHistory = [];
        this.historyLength = 5;
    }

    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    angle(p1, p2, p3) {
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        if (mag1 === 0 || mag2 === 0) return 0;
        
        const cosAngle = dot / (mag1 * mag2);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
    }

    isFingerExtended(landmarks, fingerIndex) {
        const tip = landmarks[fingerIndex * 4 + 4];
        const pip = landmarks[fingerIndex * 4 + 2];
        const mcp = landmarks[fingerIndex * 4 + 1];
        const wrist = landmarks[0];

        const tipToMcp = this.distance(tip, mcp);
        const pipToMcp = this.distance(pip, mcp);
        const tipToPip = this.distance(tip, pip);

        return tipToMcp > pipToMcp * 1.5;
    }

    countExtendedFingers(landmarks) {
        let count = 0;
        for (let i = 0; i < 5; i++) {
            if (this.isFingerExtended(landmarks, i)) {
                count++;
            }
        }
        return count;
    }

    isFist(landmarks) {
        return this.countExtendedFingers(landmarks) === 0;
    }

    isOpenHand(landmarks) {
        return this.countExtendedFingers(landmarks) === 5;
    }

    isPeace(landmarks) {
        const fingers = [];
        for (let i = 0; i < 5; i++) {
            fingers.push(this.isFingerExtended(landmarks, i));
        }
        return fingers[0] === false && fingers[1] === true && fingers[2] === true && fingers[3] === false && fingers[4] === false;
    }

    isThumbsUp(landmarks) {
        const fingers = [];
        for (let i = 0; i < 5; i++) {
            fingers.push(this.isFingerExtended(landmarks, i));
        }
        return fingers[0] === true && fingers[1] === false && fingers[2] === false && fingers[3] === false && fingers[4] === false;
    }

    isRock(landmarks) {
        const fingers = [];
        for (let i = 0; i < 5; i++) {
            fingers.push(this.isFingerExtended(landmarks, i));
        }
        return fingers[0] === true && fingers[1] === true && fingers[2] === false && fingers[3] === false && fingers[4] === true;
    }

    isCallMe(landmarks) {
        const thumbExtended = this.isFingerExtended(landmarks, 0);
        const pinkyExtended = this.isFingerExtended(landmarks, 4);
        const othersClosed = !this.isFingerExtended(landmarks, 1) && !this.isFingerExtended(landmarks, 2) && !this.isFingerExtended(landmarks, 3);
        
        return thumbExtended && pinkyExtended && othersClosed;
    }

    getHandScale(landmarks) {
        const wrist = landmarks[0];
        const middleFingerTip = landmarks[12];
        return this.distance(wrist, middleFingerTip);
    }

    getHandCenter(landmarks) {
        let sumX = 0, sumY = 0;
        landmarks.forEach(lm => {
            sumX += lm.x;
            sumY += lm.y;
        });
        return {
            x: sumX / landmarks.length,
            y: sumY / landmarks.length
        };
    }

    recognize(landmarks) {
        if (!landmarks || landmarks.length !== 21) {
            return { gesture: 'none', scale: 1, position: null };
        }

        let gesture = 'none';

        if (this.isFist(landmarks)) {
            gesture = 'fist';
        } else if (this.isOpenHand(landmarks)) {
            gesture = 'open_hand';
        } else if (this.isPeace(landmarks)) {
            gesture = 'peace';
        } else if (this.isThumbsUp(landmarks)) {
            gesture = 'thumbs_up';
        } else if (this.isRock(landmarks)) {
            gesture = 'rock';
        } else if (this.isCallMe(landmarks)) {
            gesture = 'call_me';
        }

        this.gestureHistory.push(gesture);
        if (this.gestureHistory.length > this.historyLength) {
            this.gestureHistory.shift();
        }

        const mostCommon = this.gestureHistory.reduce((acc, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {});

        let finalGesture = 'none';
        let maxCount = 0;
        for (const [g, count] of Object.entries(mostCommon)) {
            if (count > maxCount) {
                maxCount = count;
                finalGesture = g;
            }
        }

        this.previousGesture = finalGesture;

        return {
            gesture: finalGesture,
            scale: this.getHandScale(landmarks),
            position: this.getHandCenter(landmarks)
        };
    }

    getGestureName(gesture) {
        const names = {
            'none': '等待手部检测...',
            'fist': '拳头',
            'open_hand': '张开手掌',
            'peace': '剪刀手',
            'thumbs_up': '点赞',
            'rock': '摇滚手势',
            'call_me': '打电话'
        };
        return names[gesture] || gesture;
    }
}

export { GestureRecognizer };