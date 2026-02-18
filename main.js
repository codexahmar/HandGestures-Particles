// ========================================
// AETHERIS - Main Application Module
// ========================================

import * as THREE from 'three';
import { CONFIG, AppState } from './config.js';
import { vertexShader, fragmentShader, getShaderUniforms } from './shaders.js';
import { templates, getTemplateNames, getNextTemplate, getPreviousTemplate } from './templates.js';
import HandTrackingManager from './handTracking.js';

/**
 * Particle System Manager
 * Handles Three.js scene, particles, and animations
 */
class ParticleSystem {
    constructor(state) {
        this.state = state;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.geometry = null;
        this.material = null;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
    }

    /**
     * Initialize Three.js scene
     */
    initialize() {
        console.log('ParticleSystem: Initializing...');

        // Setup scene
        this.scene = new THREE.Scene();
        console.log('ParticleSystem: Scene created');

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        this.camera.position.set(
            CONFIG.camera.position.x,
            CONFIG.camera.position.y,
            CONFIG.camera.position.z
        );
        console.log('ParticleSystem: Camera created');

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.renderer.antialias,
            alpha: CONFIG.renderer.alpha
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio));

        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }
        console.log('ParticleSystem: Renderer created');

        // Setup particles
        this.setupParticles();
        console.log('ParticleSystem: Particles setup complete');

        // Apply initial template
        this.applyTemplate('galaxy');
        console.log('ParticleSystem: Initial template applied');

        // Setup event listeners
        this.setupEventListeners();
        console.log('ParticleSystem: Event listeners setup');

        return true;
    }

    /**
     * Setup particle geometry and material
     */
    setupParticles() {
        console.log('ParticleSystem: Setting up geometry...');
        this.geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(CONFIG.particles.count * 3);
        const targetPositions = new Float32Array(CONFIG.particles.count * 3);
        const colors = new Float32Array(CONFIG.particles.count * 3);

        // Initialize with random positions
        for (let i = 0; i < CONFIG.particles.count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        console.log('ParticleSystem: Geometry attributes set');

        // Create material with shaders
        console.log('ParticleSystem: Creating shader uniforms...');
        const uniforms = getShaderUniforms(CONFIG);
        console.log('ParticleSystem: Shader uniforms created');

        console.log('ParticleSystem: Creating shader material...');
        this.material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: CONFIG.material.transparent,
            blending: THREE.AdditiveBlending,
            depthWrite: CONFIG.material.depthWrite
        });
        console.log('ParticleSystem: Shader material created');

        // Create particle system
        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);
    }

    /**
     * Apply a template to particles
     */
    applyTemplate(templateName) {
        const template = templates[templateName];
        if (!template) {
            console.warn(`Template ${templateName} not found`);
            return;
        }

        const positions = this.geometry.attributes.position.array;
        const targetPositions = this.geometry.attributes.targetPosition.array;
        const currentMorph = this.state.morphProgress;

        for (let i = 0; i < CONFIG.particles.count; i++) {
            const [x, y, z] = template(i, CONFIG.particles.count);

            // Store current interpolated position as new start
            if (currentMorph >= 0) {
                const currentX = positions[i * 3] * (1 - currentMorph) + targetPositions[i * 3] * currentMorph;
                const currentY = positions[i * 3 + 1] * (1 - currentMorph) + targetPositions[i * 3 + 1] * currentMorph;
                const currentZ = positions[i * 3 + 2] * (1 - currentMorph) + targetPositions[i * 3 + 2] * currentMorph;

                positions[i * 3] = currentX;
                positions[i * 3 + 1] = currentY;
                positions[i * 3 + 2] = currentZ;
            }

            targetPositions[i * 3] = x;
            targetPositions[i * 3 + 1] = y;
            targetPositions[i * 3 + 2] = z;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.targetPosition.needsUpdate = true;

        this.state.morphProgress = 0;
        this.state.currentTemplate = templateName;

        // Update UI
        const templateSelect = document.getElementById('template-select');
        if (templateSelect) {
            templateSelect.value = templateName;
        }
    }

    /**
     * Switch to next template
     */
    nextTemplate() {
        const next = getNextTemplate(this.state.currentTemplate);
        this.applyTemplate(next);
    }

    /**
     * Switch to previous template
     */
    previousTemplate() {
        const prev = getPreviousTemplate(this.state.currentTemplate);
        this.applyTemplate(prev);
    }

    /**
     * Update animation
     */
    update(deltaTime) {
        this.state.time += deltaTime * this.state.animationSpeed;

        // Update uniforms
        if (this.material && this.material.uniforms) {
            this.material.uniforms.uTime.value = this.state.time;
            this.material.uniforms.uSpeed.value = this.state.animationSpeed;

            // Update morph progress
            if (this.state.morphProgress < 1.0) {
                this.state.morphProgress += CONFIG.animation.morphSpeed * this.state.animationSpeed;
                this.state.morphProgress = Math.min(this.state.morphProgress, 1.0);
                this.material.uniforms.uMorph.value = this.state.morphProgress;
            }
        }

        // Update cooldowns
        this.state.updateCooldown();

        // Auto-rotation
        const rotateToggle = document.getElementById('rotate-toggle');
        if (rotateToggle && rotateToggle.checked) {
            this.particles.rotation.y += CONFIG.animation.rotationSpeed.y * this.state.animationSpeed;
            this.particles.rotation.z += CONFIG.animation.rotationSpeed.z * this.state.animationSpeed;
        }

        // Mouse parallax
        this.scene.rotation.x = THREE.MathUtils.lerp(
            this.scene.rotation.x,
            this.state.mouse.y * CONFIG.animation.parallaxStrength,
            CONFIG.animation.parallaxSpeed
        );
        this.scene.rotation.y = THREE.MathUtils.lerp(
            this.scene.rotation.y,
            this.state.mouse.x * CONFIG.animation.parallaxStrength,
            CONFIG.animation.parallaxSpeed
        );

        // Update FPS counter
        this.updateFPS();
    }

    /**
     * Update FPS counter
     */
    updateFPS() {
        this.frameCount++;
        const now = performance.now();

        if (now - this.lastFPSUpdate >= CONFIG.ui.updateInterval) {
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.state.fps = fps;

            const fpsCounter = document.getElementById('fps-counter');
            if (fpsCounter) {
                fpsCounter.textContent = fps;
            }

            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }

    /**
     * Render scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Mouse move for parallax
        window.addEventListener('mousemove', (e) => {
            this.state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    /**
     * Get particles object
     */
    getParticles() {
        return this.particles;
    }

    /**
     * Get material
     */
    getMaterial() {
        return this.material;
    }

    /**
     * Reset system
     */
    reset() {
        if (this.particles) {
            this.particles.position.set(0, 0, 0);
            this.particles.rotation.set(0, 0, 0);
        }
        this.state.reset();
        this.applyTemplate('galaxy');
    }
}

/**
 * UI Manager
 * Handles user interface interactions
 */
class UIManager {
    constructor(state, particleSystem) {
        console.log('UIManager: Initializing...');
        this.state = state;
        this.particleSystem = particleSystem;
        this.setupControls();
        console.log('UIManager: Initialized');
    }

    /**
     * Setup UI controls
     */
    setupControls() {
        console.log('UIManager: Setting up controls...');
        // Template selector
        const templateSelect = document.getElementById('template-select');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                this.particleSystem.applyTemplate(e.target.value);
            });
        }

        // Glow slider
        const glowSlider = document.getElementById('glow-slider');
        const glowValue = document.getElementById('glow-value');
        if (glowSlider) {
            glowSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.particleSystem.material.uniforms.uGlow.value = value;
                if (glowValue) glowValue.textContent = value.toFixed(1);
            });
        }

        // Size slider
        const sizeSlider = document.getElementById('size-slider');
        const sizeValue = document.getElementById('size-value');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.particleSystem.material.uniforms.uPointSize.value = value;
                if (sizeValue) sizeValue.textContent = value.toFixed(1);
            });
        }

        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.state.animationSpeed = value;
                if (speedValue) speedValue.textContent = value.toFixed(1);
            });
        }

        // Color pickers
        this.setupColorPickers();

        // Action buttons
        this.setupButtons();

        // Panel collapse
        this.setupPanelCollapse();
    }

    /**
     * Setup color pickers
     */
    setupColorPickers() {
        const primaryColor = document.getElementById('color-primary');
        if (primaryColor) {
            primaryColor.addEventListener('input', (e) => {
                this.particleSystem.material.uniforms.uBaseColor.value.set(e.target.value);
            });
        }

        const secondaryColor = document.getElementById('color-secondary');
        if (secondaryColor) {
            secondaryColor.addEventListener('input', (e) => {
                this.particleSystem.material.uniforms.uSecondaryColor.value.set(e.target.value);
            });
        }

        const accentColor = document.getElementById('color-accent');
        if (accentColor) {
            accentColor.addEventListener('input', (e) => {
                this.particleSystem.material.uniforms.uAccentColor.value.set(e.target.value);
            });
        }

        // Random color button
        const randomColorBtn = document.getElementById('random-color');
        if (randomColorBtn) {
            randomColorBtn.addEventListener('click', () => {
                if (primaryColor) primaryColor.value = this.getRandomColor();
                if (secondaryColor) secondaryColor.value = this.getRandomColor();
                if (accentColor) accentColor.value = this.getRandomColor();

                this.particleSystem.material.uniforms.uBaseColor.value.set(primaryColor.value);
                this.particleSystem.material.uniforms.uSecondaryColor.value.set(secondaryColor.value);
                this.particleSystem.material.uniforms.uAccentColor.value.set(accentColor.value);
            });
        }
    }

    /**
     * Get random hex color
     */
    getRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }

    /**
     * Setup action buttons
     */
    setupButtons() {
        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.particleSystem.reset();
            });
        }

        // Screenshot button
        const screenshotBtn = document.getElementById('screenshot-btn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => {
                this.takeScreenshot();
            });
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
    }

    /**
     * Take screenshot
     */
    takeScreenshot() {
        const canvas = this.particleSystem.renderer.domElement;
        const link = document.createElement('a');
        link.download = `aetheris-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Setup panel collapse
     */
    setupPanelCollapse() {
        const collapseBtn = document.getElementById('collapse-btn');
        const controlPanel = document.querySelector('.control-panel');

        if (collapseBtn && controlPanel) {
            collapseBtn.addEventListener('click', () => {
                controlPanel.classList.toggle('collapsed');
            });
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500);
        }
    }
}

/**
 * Main Application
 */
class AetherisApp {
    constructor() {
        this.state = new AppState();
        this.particleSystem = null;
        this.uiManager = null;
        this.handTracking = null;
        this.isRunning = false;
        this.lastTime = 0;
    }

    /**
     * Initialize application
     */
    async initialize() {
        try {
            console.log('Initializing Aetheris...');

            // Initialize particle system
            this.particleSystem = new ParticleSystem(this.state);
            this.particleSystem.initialize();

            // Initialize UI manager
            this.uiManager = new UIManager(this.state, this.particleSystem);

            // Start animation loop immediately (don't wait for camera)
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();

            // Hide loading screen
            this.uiManager.hideLoadingScreen();

            // Initialize hand tracking in background (non-blocking)
            this.handTracking = new HandTrackingManager(this.state, this.particleSystem);
            this.handTracking.initialize().catch(error => {
                console.warn('Hand tracking unavailable:', error);
                // App continues to work without hand tracking
            });

            console.log('Aetheris initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Aetheris:', error);
            // Still hide loading screen on error
            if (this.uiManager) {
                this.uiManager.hideLoadingScreen();
            }
        }
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update systems
        this.particleSystem.update(deltaTime);

        // Render
        this.particleSystem.render();
    }

    /**
     * Stop application
     */
    stop() {
        this.isRunning = false;
        if (this.handTracking) {
            this.handTracking.stop();
        }
    }
}

// Initialize application when DOM is loaded
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new AetherisApp();
        app.initialize();
    });
} else {
    app = new AetherisApp();
    app.initialize();
}

// Export for external access
export default AetherisApp;
