// ========================================
// AETHERIS - Vision & Hand Tracking Module
// ========================================

import * as THREE from 'three';
import { CONFIG } from './config.js';

const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
];

export class HandTrackingManager {
    constructor(state, particleSystem) {
        this.state = state;
        this.particleSystem = particleSystem;
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.overlayCanvas = null;
        this.overlayCtx = null;
        this.isInitialized = false;

        this.smoothedHand = null;
        this.wasFistClosed = false;

        this.statusDot = document.getElementById('status-dot');
        this.gestureText = document.getElementById('gesture-text');
        this.videoToggle = document.getElementById('video-toggle');

        this.setupUI();
    }

    setupUI() {
        if (this.videoToggle) {
            this.videoToggle.addEventListener('click', () => this.toggleCamera());
        }

        this.overlayCanvas = document.getElementById('hand-canvas');
        if (this.overlayCanvas) {
            this.overlayCtx = this.overlayCanvas.getContext('2d');
            this.resizeOverlay();
            window.addEventListener('resize', () => this.resizeOverlay());
        }
    }

    resizeOverlay() {
        if (this.overlayCanvas && this.videoElement) {
            const rect = this.videoElement.getBoundingClientRect();
            this.overlayCanvas.width = rect.width || 180;
            this.overlayCanvas.height = rect.height || 135;
        }
    }

    async initialize() {
        try {
            this.videoElement = document.getElementById('video-preview');
            if (!this.videoElement) return false;

            if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
                this.updateStatus('Standby (Mouse Mode)', false);
                return false;
            }

            this.hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            // Lite model complexity (0) ensures smooth 60fps execution on any device
            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: CONFIG.handTracking.modelComplexity,
                minDetectionConfidence: CONFIG.handTracking.minDetectionConfidence,
                minTrackingConfidence: CONFIG.handTracking.minTrackingConfidence
            });

            this.hands.onResults((results) => this.onResults(results));

            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.state.cameraEnabled && this.hands) {
                        try {
                            await this.hands.send({ image: this.videoElement });
                        } catch (e) { }
                    }
                },
                width: 480,
                height: 360
            });

            const cameraStart = this.camera.start();
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Camera timeout')), 5000)
            );

            await Promise.race([cameraStart, timeout]);

            this.isInitialized = true;
            this.resizeOverlay();
            this.updateStatus('Camera Active', true);
            return true;
        } catch (error) {
            this.updateStatus('Standby (Mouse Mode)', false);
            return false;
        }
    }

    onResults(results) {
        if (this.overlayCtx && this.overlayCanvas) {
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.handleNoHand();
            return;
        }

        const raw = results.multiHandLandmarks[0];
        this.state.handActive = true;

        // Exponential smoothing
        if (!this.smoothedHand) {
            this.smoothedHand = raw.map(p => ({ ...p }));
        } else {
            const a = CONFIG.handTracking.smoothing;
            for (let i = 0; i < raw.length; i++) {
                this.smoothedHand[i].x = this.smoothedHand[i].x * a + raw[i].x * (1 - a);
                this.smoothedHand[i].y = this.smoothedHand[i].y * a + raw[i].y * (1 - a);
                this.smoothedHand[i].z = this.smoothedHand[i].z * a + raw[i].z * (1 - a);
            }
        }

        this.drawHandOverlay(this.smoothedHand);
        this.processGestures(this.smoothedHand);
    }

    drawHandOverlay(landmarks) {
        if (!this.overlayCtx || !this.overlayCanvas) return;
        const ctx = this.overlayCtx;
        const w = this.overlayCanvas.width;
        const h = this.overlayCanvas.height;

        const getX = (pt) => (1 - pt.x) * w;
        const getY = (pt) => pt.y * h;

        // Clean, subtle connection lines
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';

        HAND_CONNECTIONS.forEach(([i1, i2]) => {
            const p1 = landmarks[i1];
            const p2 = landmarks[i2];
            ctx.beginPath();
            ctx.moveTo(getX(p1), getY(p1));
            ctx.lineTo(getX(p2), getY(p2));
            ctx.stroke();
        });

        // Joint points
        landmarks.forEach((pt, idx) => {
            const px = getX(pt);
            const py = getY(pt);
            const isTip = [4, 8, 12, 16, 20].includes(idx);

            ctx.beginPath();
            ctx.arc(px, py, isTip ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fillStyle = isTip ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
        });
    }

    processGestures(landmarks) {
        const material = this.particleSystem.getMaterial();
        if (!material || !material.uniforms) return;

        const palmCenter = landmarks[9];
        const targetX = (0.5 - palmCenter.x) * CONFIG.handTracking.followScale.x;
        const targetY = (0.5 - palmCenter.y) * CONFIG.handTracking.followScale.y;

        material.uniforms.uHandPos.value.set(targetX, targetY, 0);
        material.uniforms.uHandActive.value = 1.0;

        const particles = this.particleSystem.getParticles();
        if (particles) {
            particles.position.x = THREE.MathUtils.lerp(particles.position.x, targetX * 0.35, CONFIG.handTracking.followSpeed);
            particles.position.y = THREE.MathUtils.lerp(particles.position.y, targetY * 0.35, CONFIG.handTracking.followSpeed);
        }

        const handSpan = Math.hypot(landmarks[0].x - landmarks[12].x, landmarks[0].y - landmarks[12].y);
        const isOpen = handSpan > CONFIG.handTracking.openPalmThreshold;
        const isFist = handSpan < CONFIG.handTracking.fistThreshold;

        // Fist clench
        if (isFist) {
            this.wasFistClosed = true;
            material.uniforms.uExpansion.value = THREE.MathUtils.lerp(
                material.uniforms.uExpansion.value,
                CONFIG.handTracking.expansionAmount.closed,
                0.12
            );
            material.uniforms.uPointSize.value = THREE.MathUtils.lerp(
                material.uniforms.uPointSize.value,
                CONFIG.handTracking.sizeChange.closed,
                0.12
            );
            material.uniforms.uHandForce.value = -1.5;
            this.updateGestureText('Fist: Contracting');
            return;
        }

        // Release shockwave
        if (this.wasFistClosed && !isFist) {
            this.particleSystem.triggerShockwave(new THREE.Vector3(targetX, targetY, 0));
            this.wasFistClosed = false;
        }

        // Pinch (Thumb 4 + Index 8)
        const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
        if (pinchDist < CONFIG.handTracking.pinchThreshold) {
            const hue = (performance.now() * 0.0005) % 1.0;
            material.uniforms.uBaseColor.value.setHSL(hue, 0.8, 0.55);
            this.updateGestureText('Pinch: Color Shift');
            return;
        }

        // Open Palm
        if (isOpen) {
            material.uniforms.uExpansion.value = THREE.MathUtils.lerp(
                material.uniforms.uExpansion.value,
                CONFIG.handTracking.expansionAmount.open,
                0.1
            );
            material.uniforms.uPointSize.value = THREE.MathUtils.lerp(
                material.uniforms.uPointSize.value,
                CONFIG.handTracking.sizeChange.open,
                0.1
            );
            material.uniforms.uHandForce.value = 1.8;
            this.updateGestureText('Open Palm: Expanding');
        } else {
            material.uniforms.uExpansion.value = THREE.MathUtils.lerp(material.uniforms.uExpansion.value, 0.0, 0.08);
            material.uniforms.uPointSize.value = THREE.MathUtils.lerp(material.uniforms.uPointSize.value, CONFIG.particles.defaultSize, 0.08);
            material.uniforms.uHandForce.value = 0.5;
            this.updateGestureText('Tracking Hand');
        }

        // Swipe
        this.detectSwipe(landmarks);
    }

    detectSwipe(landmarks) {
        const currentX = landmarks[9].x;
        const deltaX = currentX - this.state.lastHandX;

        if (Math.abs(deltaX) > CONFIG.handTracking.swipeThreshold && this.state.swipeCooldown <= 0) {
            if (deltaX < 0) {
                this.particleSystem.nextTemplate();
            } else {
                this.particleSystem.previousTemplate();
            }
            this.state.swipeCooldown = CONFIG.handTracking.swipeCooldown;
            this.updateGestureText('Swipe: Template Switch');
        }
        this.state.lastHandX = currentX;
    }

    handleNoHand() {
        this.state.handActive = false;
        this.wasFistClosed = false;

        const material = this.particleSystem.getMaterial();
        if (material && material.uniforms) {
            material.uniforms.uHandActive.value = 0.0;
            material.uniforms.uExpansion.value = THREE.MathUtils.lerp(material.uniforms.uExpansion.value, 0.0, 0.06);
            material.uniforms.uPointSize.value = THREE.MathUtils.lerp(material.uniforms.uPointSize.value, CONFIG.particles.defaultSize, 0.06);
        }

        this.updateStatus('Awaiting Hand', false);
        this.updateGestureText('Standby: Show hand or click to interact');
    }

    updateStatus(message, active) {
        if (this.statusDot) {
            this.statusDot.classList.toggle('active', active);
        }
    }

    updateGestureText(text) {
        if (this.gestureText) {
            this.gestureText.textContent = text;
        }
    }

    toggleCamera() {
        this.state.cameraEnabled = !this.state.cameraEnabled;
        if (this.videoElement) {
            this.videoElement.style.display = this.state.cameraEnabled ? 'block' : 'none';
        }
        if (this.overlayCanvas) {
            this.overlayCanvas.style.display = this.state.cameraEnabled ? 'block' : 'none';
        }
        this.updateStatus(this.state.cameraEnabled ? 'Camera Active' : 'Camera Muted', this.state.cameraEnabled);
    }

    stop() {
        if (this.camera) this.camera.stop();
        if (this.hands) this.hands.close();
        this.isInitialized = false;
    }
}

export default HandTrackingManager;
