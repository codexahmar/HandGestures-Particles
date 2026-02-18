// ========================================
// AETHERIS - Configuration Module
// ========================================

/**
 * Application Configuration
 * Central configuration for the particle system
 */
export const CONFIG = {
    // Particle Settings
    particles: {
        count: 15000,
        defaultSize: 1.0,
        minSize: 0.1,
        maxSize: 5.0,
    },

    // Camera Settings
    camera: {
        fov: 60,
        near: 0.1,
        far: 1000,
        position: { x: 0, y: 2, z: 12 }
    },

    // Rendering Settings
    renderer: {
        antialias: true,
        alpha: true,
        maxPixelRatio: 2
    },

    // Animation Settings
    animation: {
        defaultSpeed: 1.0,
        morphSpeed: 0.02,
        rotationSpeed: { y: 0.003, z: 0.001 },
        parallaxStrength: 0.1,
        parallaxSpeed: 0.05
    },

    // Hand Tracking Settings
    handTracking: {
        enabled: true,
        maxHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
        swipeCooldown: 30,
        swipeThreshold: 0.1,
        pinchThreshold: 0.05,
        openPalmThreshold: 0.4,
        expansionAmount: { open: 1.2, closed: -0.5 },
        sizeChange: { open: 2.5, closed: 0.5 },
        followSpeed: 0.1,
        followScale: { x: 15, y: 10 }
    },

    // Material Settings
    material: {
        defaultGlow: 1.5,
        minGlow: 0.3,
        maxGlow: 3.0,
        defaultColor: 0x00f2ff,
        blending: 'additive',
        transparent: true,
        depthWrite: false
    },

    // UI Settings
    ui: {
        updateInterval: 100, // ms for FPS counter
        collapsible: true,
        videoPreviewOpacity: 0.6
    },

    // Performance Settings
    performance: {
        targetFPS: 60,
        autoOptimize: true,
        lowFPSThreshold: 30,
        reducedParticleCount: 8000
    }
};

/**
 * Application State
 * Mutable state for runtime values
 */
export class AppState {
    constructor() {
        this.currentTemplate = 'galaxy';
        this.morphProgress = 1.0;
        this.animationSpeed = 1.0;
        this.handActive = false;
        this.lastHandX = 0;
        this.swipeCooldown = 0;
        this.isPaused = false;
        this.cameraEnabled = true;
        this.fps = 60;
        this.time = 0;
        this.mouse = { x: 0, y: 0 };
        this.colors = {
            primary: CONFIG.material.defaultColor,
            secondary: 0xff00ff,
            accent: 0xffaa00
        };
    }

    /**
     * Reset state to defaults
     */
    reset() {
        this.currentTemplate = 'galaxy';
        this.morphProgress = 1.0;
        this.animationSpeed = 1.0;
        this.handActive = false;
        this.lastHandX = 0;
        this.swipeCooldown = 0;
        this.colors = {
            primary: CONFIG.material.defaultColor,
            secondary: 0xff00ff,
            accent: 0xffaa00
        };
    }

    /**
     * Update swipe cooldown
     */
    updateCooldown() {
        if (this.swipeCooldown > 0) {
            this.swipeCooldown--;
        }
    }
}

export default { CONFIG, AppState };
