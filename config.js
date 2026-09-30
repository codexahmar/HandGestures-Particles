// ========================================
// AETHERIS - Core Configuration & State
// ========================================

/**
 * Application Configuration
 * Optimized for high performance (60 FPS) and clean professional aesthetics
 */
export const CONFIG = {
    // Particle Settings - Optimized for smooth 60 FPS
    particles: {
        count: 8000,
        defaultSize: 1.4,
        minSize: 0.4,
        maxSize: 4.0
    },

    // Camera Settings
    camera: {
        fov: 55,
        near: 0.1,
        far: 1000,
        position: { x: 0, y: 1.0, z: 11.0 }
    },

    // Rendering Settings - Capped pixel ratio to prevent Retina GPU bottlenecks
    renderer: {
        antialias: true,
        alpha: true,
        maxPixelRatio: 1.5
    },

    // Animation Settings
    animation: {
        defaultSpeed: 1.0,
        morphSpeed: 0.03,
        rotationSpeed: { y: 0.002, z: 0.0008 },
        parallaxStrength: 0.08,
        parallaxSpeed: 0.05
    },

    // Hand Tracking Settings
    handTracking: {
        enabled: true,
        maxHands: 1,
        modelComplexity: 0, // 0 = Lite (Fastest & lowest CPU load), 1 = Full
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        swipeCooldown: 25,
        swipeThreshold: 0.09,
        pinchThreshold: 0.055,
        openPalmThreshold: 0.38,
        fistThreshold: 0.22,
        expansionAmount: { open: 1.4, closed: -0.7 },
        sizeChange: { open: 2.0, closed: 0.6 },
        followSpeed: 0.1,
        followScale: { x: 12, y: 8, z: 6 },
        smoothing: 0.3
    },

    // Material Defaults
    material: {
        defaultGlow: 1.8,
        minGlow: 0.5,
        maxGlow: 3.5,
        defaultColor: 0x38bdf8,   // Refined Sky Blue
        secondaryColor: 0x818cf8, // Soft Indigo
        accentColor: 0xf43f5e     // Coral Rose
    },

    // Audio Reactivity
    audio: {
        fftSize: 128,
        smoothingTimeConstant: 0.8,
        bassSensitivity: 1.4,
        trebleSensitivity: 1.0
    },

    // Recording Settings
    recording: {
        fps: 60,
        videoBitsPerSecond: 6000000
    },

    // UI Settings
    ui: {
        updateInterval: 120
    }
};

/**
 * Mutable Application State
 */
export class AppState {
    constructor() {
        this.currentTemplate = 'galaxy';
        this.morphProgress = 1.0;
        this.animationSpeed = 1.0;
        this.handActive = false;
        this.lastHandX = 0;
        this.swipeCooldown = 0;
        this.cameraEnabled = true;
        this.fps = 60;
        this.time = 0;
        this.mouse = { x: 0, y: 0 };
        this.colors = {
            primary: CONFIG.material.defaultColor,
            secondary: CONFIG.material.secondaryColor,
            accent: CONFIG.material.accentColor
        };

        // Interaction State
        this.isRecording = false;
        this.recordingTime = 0;
        this.shockwaveProgress = 1.0;
        this.audioActive = false;
        this.audioBass = 0.0;
        this.audioTreble = 0.0;
    }

    reset() {
        this.currentTemplate = 'galaxy';
        this.morphProgress = 1.0;
        this.animationSpeed = 1.0;
        this.handActive = false;
        this.lastHandX = 0;
        this.swipeCooldown = 0;
        this.shockwaveProgress = 1.0;
        this.colors = {
            primary: CONFIG.material.defaultColor,
            secondary: CONFIG.material.secondaryColor,
            accent: CONFIG.material.accentColor
        };
    }

    updateCooldown() {
        if (this.swipeCooldown > 0) {
            this.swipeCooldown--;
        }
    }
}

export default { CONFIG, AppState };
