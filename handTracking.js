// ========================================
// AETHERIS - Hand Tracking Module
// ========================================

import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Hand Tracking Manager
 * Handles MediaPipe Hands integration and gesture recognition
 */
export class HandTrackingManager {
    constructor(state, particleSystem) {
        this.state = state;
        this.particleSystem = particleSystem;
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.isInitialized = false;

        // UI Elements
        this.statusDot = document.getElementById('status-dot');
        this.gestureText = document.getElementById('gesture-text');
        this.videoToggle = document.getElementById('video-toggle');

        this.setupUI();
    }

    /**
     * Setup UI event listeners
     */
    setupUI() {
        if (this.videoToggle) {
            this.videoToggle.addEventListener('click', () => {
                this.toggleCamera();
            });
        }
    }

    /**
     * Initialize hand tracking
     */
    async initialize() {
        try {
            this.videoElement = document.getElementById('video-preview');

            if (!this.videoElement) {
                console.warn('Video element not found');
                this.updateStatus('Camera unavailable', false);
                return false;
            }

            // Check if MediaPipe is available
            if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
                console.warn('MediaPipe libraries not loaded');
                this.updateStatus('Hand tracking unavailable', false);
                return false;
            }

            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            this.hands.setOptions({
                maxNumHands: CONFIG.handTracking.maxHands,
                modelComplexity: CONFIG.handTracking.modelComplexity,
                minDetectionConfidence: CONFIG.handTracking.minDetectionConfidence,
                minTrackingConfidence: CONFIG.handTracking.minTrackingConfidence
            });

            // Setup results callback
            this.hands.onResults((results) => this.onResults(results));

            // Initialize camera with timeout
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.state.cameraEnabled) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 640,
                height: 480
            });

            // Add timeout to prevent hanging
            const cameraStartPromise = this.camera.start();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Camera timeout')), 5000)
            );

            await Promise.race([cameraStartPromise, timeoutPromise]);

            this.isInitialized = true;
            this.updateStatus('Camera initialized', true);

            return true;
        } catch (error) {
            console.warn('Hand tracking initialization failed:', error.message);
            this.updateStatus('Hand tracking disabled', false);
            return false;
        }
    }

    /**
     * Process hand tracking results
     */
    onResults(results) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.handleNoHand();
            return;
        }

        const landmarks = results.multiHandLandmarks[0];
        this.state.handActive = true;
        this.updateStatus('Hand detected', true);

        // Detect and handle gestures
        this.detectGestures(landmarks);

        // Follow hand position
        this.followHand(landmarks);
    }

    /**
     * Handle when no hand is detected
     */
    handleNoHand() {
        this.state.handActive = false;
        this.updateStatus('No hand detected', false);

        // Smoothly return to normal state
        const material = this.particleSystem.getMaterial();
        if (material && material.uniforms) {
            material.uniforms.uExpansion.value = THREE.MathUtils.lerp(
                material.uniforms.uExpansion.value,
                0,
                0.05
            );
            material.uniforms.uPointSize.value = THREE.MathUtils.lerp(
                material.uniforms.uPointSize.value,
                CONFIG.particles.defaultSize,
                0.05
            );
        }
    }

    /**
     * Detect and process hand gestures
     */
    detectGestures(landmarks) {
        const material = this.particleSystem.getMaterial();
        if (!material || !material.uniforms) return;

        // 1. Open Palm vs Fist Detection
        const palmDistance = this.calculateDistance(landmarks[0], landmarks[12]);
        const isOpenPalm = palmDistance > CONFIG.handTracking.openPalmThreshold;

        if (isOpenPalm) {
            // Open palm - expand particles
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
            this.updateGestureText('Open Palm: Expanding');
        } else {
            // Closed fist - contract particles
            material.uniforms.uExpansion.value = THREE.MathUtils.lerp(
                material.uniforms.uExpansion.value,
                CONFIG.handTracking.expansionAmount.closed,
                0.1
            );
            material.uniforms.uPointSize.value = THREE.MathUtils.lerp(
                material.uniforms.uPointSize.value,
                CONFIG.handTracking.sizeChange.closed,
                0.1
            );

            // Change to cool color
            material.uniforms.uBaseColor.value.lerp(
                new THREE.Color(0x4400ff),
                0.05
            );
            this.updateGestureText('Fist: Contracting');
        }

        // 2. Pinch Detection (Thumb + Index)
        const pinchDistance = this.calculateDistance(landmarks[4], landmarks[8]);

        if (pinchDistance < CONFIG.handTracking.pinchThreshold) {
            // Cycle through colors
            const hue = (Date.now() * 0.0005) % 1;
            material.uniforms.uBaseColor.value.setHSL(hue, 0.8, 0.5);
            this.updateGestureText('Pinch: Color Shifting');
        }

        // 3. Swipe Detection
        this.detectSwipe(landmarks);
    }

    /**
     * Detect swipe gesture
     */
    detectSwipe(landmarks) {
        const currentX = landmarks[9].x; // Middle finger base
        const deltaX = currentX - this.state.lastHandX;

        if (Math.abs(deltaX) > CONFIG.handTracking.swipeThreshold &&
            this.state.swipeCooldown <= 0) {

            // Determine swipe direction
            if (deltaX > 0) {
                this.particleSystem.nextTemplate();
            } else {
                this.particleSystem.previousTemplate();
            }

            this.state.swipeCooldown = CONFIG.handTracking.swipeCooldown;
            this.updateGestureText('Swipe: Changing Template');
        }

        this.state.lastHandX = currentX;
    }

    /**
     * Make particles follow hand position
     */
    followHand(landmarks) {
        const handX = landmarks[9].x; // Middle finger base
        const handY = landmarks[9].y;

        const particles = this.particleSystem.getParticles();
        if (!particles) return;

        const targetX = (0.5 - handX) * CONFIG.handTracking.followScale.x;
        const targetY = (0.5 - handY) * CONFIG.handTracking.followScale.y;

        particles.position.x = THREE.MathUtils.lerp(
            particles.position.x,
            targetX,
            CONFIG.handTracking.followSpeed
        );
        particles.position.y = THREE.MathUtils.lerp(
            particles.position.y,
            targetY,
            CONFIG.handTracking.followSpeed
        );
    }

    /**
     * Calculate Euclidean distance between two landmarks
     */
    calculateDistance(landmark1, landmark2) {
        return Math.hypot(
            landmark1.x - landmark2.x,
            landmark1.y - landmark2.y,
            landmark1.z - landmark2.z
        );
    }

    /**
     * Update status indicator
     */
    updateStatus(message, active) {
        if (this.statusDot) {
            if (active) {
                this.statusDot.classList.add('active');
            } else {
                this.statusDot.classList.remove('active');
            }
        }
    }

    /**
     * Update gesture text
     */
    updateGestureText(text) {
        if (this.gestureText) {
            this.gestureText.textContent = text;
        }
    }

    /**
     * Toggle camera on/off
     */
    toggleCamera() {
        this.state.cameraEnabled = !this.state.cameraEnabled;

        if (this.videoElement) {
            this.videoElement.style.display = this.state.cameraEnabled ? 'block' : 'none';
        }

        this.updateStatus(
            this.state.cameraEnabled ? 'Camera enabled' : 'Camera disabled',
            this.state.cameraEnabled
        );
    }

    /**
     * Stop hand tracking
     */
    stop() {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.hands) {
            this.hands.close();
        }
        this.isInitialized = false;
    }
}

export default HandTrackingManager;
