// ========================================
// AETHERIS - Core Application Engine
// ========================================

import * as THREE from 'three';
import { CONFIG, AppState } from './config.js';
import { vertexShader, fragmentShader, getShaderUniforms } from './shaders.js';
import { templates, getTemplateNames, getNextTemplate, getPreviousTemplate, templateColorPresets } from './templates.js';
import HandTrackingManager from './handTracking.js';

/**
 * Lightweight Web Audio Analyzer
 */
class AudioEngine {
    constructor(state) {
        this.state = state;
        this.audioCtx = null;
        this.analyzer = null;
        this.dataArray = null;
        this.micStream = null;
        this.isMicActive = false;
    }

    init() {
        if (this.audioCtx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.audioCtx = new AudioContext();
        this.analyzer = this.audioCtx.createAnalyser();
        this.analyzer.fftSize = CONFIG.audio.fftSize;
        this.analyzer.smoothingTimeConstant = CONFIG.audio.smoothingTimeConstant;
        this.dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
    }

    async toggleMicrophone() {
        this.init();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        if (this.isMicActive) {
            if (this.micStream) {
                this.micStream.getTracks().forEach(t => t.stop());
                this.micStream = null;
            }
            this.isMicActive = false;
            this.state.audioActive = false;
            return false;
        }

        try {
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioCtx.createMediaStreamSource(this.micStream);
            source.connect(this.analyzer);
            this.isMicActive = true;
            this.state.audioActive = true;
            return true;
        } catch (err) {
            this.isMicActive = false;
            this.state.audioActive = false;
            return false;
        }
    }

    update() {
        if (!this.analyzer || !this.dataArray || !this.state.audioActive) {
            this.state.audioBass = THREE.MathUtils.lerp(this.state.audioBass, 0, 0.1);
            this.state.audioTreble = THREE.MathUtils.lerp(this.state.audioTreble, 0, 0.1);
            return;
        }

        this.analyzer.getByteFrequencyData(this.dataArray);

        // Sub-bass (bins 1-3)
        let bassSum = 0;
        for (let i = 1; i <= 3; i++) bassSum += this.dataArray[i];
        const bassVal = (bassSum / 3) / 255;

        // Treble (bins 16-32)
        let trebleSum = 0;
        for (let i = 16; i <= 32; i++) trebleSum += this.dataArray[i];
        const trebleVal = (trebleSum / 17) / 255;

        this.state.audioBass = bassVal * CONFIG.audio.bassSensitivity;
        this.state.audioTreble = trebleVal * CONFIG.audio.trebleSensitivity;
    }
}

/**
 * Screen / Canvas Video Recorder
 */
class StudioRecorder {
    constructor(canvas, state) {
        this.canvas = canvas;
        this.state = state;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordTimer = null;
        this.recordSeconds = 0;
    }

    toggleRecording() {
        if (this.state.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        try {
            const stream = this.canvas.captureStream(CONFIG.recording.fps);
            let options = { mimeType: 'video/webm;codecs=vp9' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm' };
            }

            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(stream, options);

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.download = `aetheris-${this.state.currentTemplate}-${Date.now()}.webm`;
                a.href = url;
                a.click();
                URL.revokeObjectURL(url);
            };

            this.mediaRecorder.start(250);
            this.state.isRecording = true;
            this.recordSeconds = 0;

            const recordBtn = document.getElementById('record-btn');
            if (recordBtn) {
                recordBtn.classList.add('recording');
                recordBtn.textContent = 'Stop (00:00)';
            }

            this.recordTimer = setInterval(() => {
                this.recordSeconds++;
                const mins = String(Math.floor(this.recordSeconds / 60)).padStart(2, '0');
                const secs = String(this.recordSeconds % 60).padStart(2, '0');
                if (recordBtn) recordBtn.textContent = `Stop (${mins}:${secs})`;
            }, 1000);
        } catch (err) {
            console.warn('Recording unavailable:', err);
        }
    }

    stopRecording() {
        if (!this.state.isRecording || !this.mediaRecorder) return;
        this.mediaRecorder.stop();
        this.state.isRecording = false;
        clearInterval(this.recordTimer);

        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.classList.remove('recording');
            recordBtn.textContent = 'Record Clip';
        }
    }
}

/**
 * Three.js Particle System
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

    initialize() {
        this.scene = new THREE.Scene();

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

        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.renderer.antialias,
            alpha: CONFIG.renderer.alpha,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio));

        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        }

        this.setupParticles();
        this.applyTemplate('galaxy');
        this.setupEventListeners();

        return true;
    }

    setupParticles() {
        const count = CONFIG.particles.count;
        this.geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(count * 3);
        const targetPositions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            colors[i * 3] = 0.5;
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 1.0;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const uniforms = getShaderUniforms(CONFIG);
        this.material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);

        const countEl = document.getElementById('particle-count');
        if (countEl) countEl.textContent = `${Math.round(count / 1000)}k`;
    }

    applyTemplate(templateName) {
        const template = templates[templateName] || templates.galaxy;
        const count = CONFIG.particles.count;
        const positions = this.geometry.attributes.position.array;
        const targetPositions = this.geometry.attributes.targetPosition.array;
        const colors = this.geometry.attributes.color.array;
        const currentMorph = this.state.morphProgress;

        const presetColors = templateColorPresets[templateName];
        if (presetColors) {
            this.material.uniforms.uBaseColor.value.set(presetColors.primary);
            this.material.uniforms.uSecondaryColor.value.set(presetColors.secondary);

            const pPicker = document.getElementById('color-primary');
            const sPicker = document.getElementById('color-secondary');
            if (pPicker) pPicker.value = presetColors.primary;
            if (sPicker) sPicker.value = presetColors.secondary;
        }

        for (let i = 0; i < count; i++) {
            const [x, y, z] = template(i, count);

            if (currentMorph >= 0) {
                positions[i * 3] = positions[i * 3] * (1 - currentMorph) + targetPositions[i * 3] * currentMorph;
                positions[i * 3 + 1] = positions[i * 3 + 1] * (1 - currentMorph) + targetPositions[i * 3 + 1] * currentMorph;
                positions[i * 3 + 2] = positions[i * 3 + 2] * (1 - currentMorph) + targetPositions[i * 3 + 2] * currentMorph;
            }

            targetPositions[i * 3] = x;
            targetPositions[i * 3 + 1] = y;
            targetPositions[i * 3 + 2] = z;

            const dist = Math.hypot(x, z);
            const hue = (dist * 0.1 + (i / count) * 0.2) % 1.0;
            const c = new THREE.Color().setHSL(hue, 0.75, 0.6);
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.targetPosition.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;

        this.state.morphProgress = 0;
        this.state.currentTemplate = templateName;

        const templateSelect = document.getElementById('template-select');
        if (templateSelect) templateSelect.value = templateName;
    }

    triggerShockwave(origin = new THREE.Vector3(0, 0, 0)) {
        this.state.shockwaveProgress = 0.0;
        if (this.material && this.material.uniforms) {
            this.material.uniforms.uShockwaveOrigin.value.copy(origin);
            this.material.uniforms.uShockwaveProgress.value = 0.0;
        }
    }

    nextTemplate() {
        const next = getNextTemplate(this.state.currentTemplate);
        this.applyTemplate(next);
    }

    previousTemplate() {
        const prev = getPreviousTemplate(this.state.currentTemplate);
        this.applyTemplate(prev);
    }

    update(deltaTime) {
        this.state.time += deltaTime * this.state.animationSpeed;

        if (this.material && this.material.uniforms) {
            this.material.uniforms.uTime.value = this.state.time;
            this.material.uniforms.uSpeed.value = this.state.animationSpeed;
            this.material.uniforms.uAudioBass.value = this.state.audioBass;
            this.material.uniforms.uAudioTreble.value = this.state.audioTreble;

            if (this.state.morphProgress < 1.0) {
                this.state.morphProgress += CONFIG.animation.morphSpeed * this.state.animationSpeed;
                this.state.morphProgress = Math.min(this.state.morphProgress, 1.0);
                this.material.uniforms.uMorph.value = this.state.morphProgress;
            }

            if (this.state.shockwaveProgress < 1.0) {
                this.state.shockwaveProgress += deltaTime * 1.6;
                this.material.uniforms.uShockwaveProgress.value = Math.min(this.state.shockwaveProgress, 1.0);
            }
        }

        this.state.updateCooldown();

        const rotateToggle = document.getElementById('rotate-toggle');
        if (rotateToggle && rotateToggle.checked) {
            this.particles.rotation.y += CONFIG.animation.rotationSpeed.y * this.state.animationSpeed;
        }

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

        this.updateFPS();
    }

    updateFPS() {
        this.frameCount++;
        const now = performance.now();

        if (now - this.lastFPSUpdate >= CONFIG.ui.updateInterval) {
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.state.fps = fps;

            const fpsCounter = document.getElementById('fps-counter');
            if (fpsCounter) fpsCounter.textContent = `${fps} FPS`;

            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());

        window.addEventListener('mousemove', (e) => {
            this.state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Mouse click interaction fallback
        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('#ui-layer')) return;
            if (!this.state.handActive) {
                this.material.uniforms.uHandActive.value = 1.0;
                this.material.uniforms.uHandForce.value = -1.2;
            }
        });

        window.addEventListener('mouseup', () => {
            if (!this.state.handActive) {
                this.triggerShockwave(new THREE.Vector3(this.state.mouse.x * 4, this.state.mouse.y * 4, 0));
                this.material.uniforms.uHandActive.value = 0.0;
            }
        });
    }

    getParticles() { return this.particles; }
    getMaterial() { return this.material; }

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
 * Clean UI Manager
 */
class UIManager {
    constructor(state, particleSystem, recorder, audio) {
        this.state = state;
        this.particleSystem = particleSystem;
        this.recorder = recorder;
        this.audio = audio;
        this.setupControls();
        this.setupHotkeys();
    }

    setupControls() {
        const templateSelect = document.getElementById('template-select');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                this.particleSystem.applyTemplate(e.target.value);
            });
        }

        this.setupSlider('glow-slider', 'glow-value', (val) => {
            this.particleSystem.material.uniforms.uGlow.value = val;
        });
        this.setupSlider('size-slider', 'size-value', (val) => {
            this.particleSystem.material.uniforms.uPointSize.value = val;
        });
        this.setupSlider('speed-slider', 'speed-value', (val) => {
            this.state.animationSpeed = val;
        });

        const pColor = document.getElementById('color-primary');
        const sColor = document.getElementById('color-secondary');
        if (pColor) pColor.addEventListener('input', (e) => this.particleSystem.material.uniforms.uBaseColor.value.set(e.target.value));
        if (sColor) sColor.addEventListener('input', (e) => this.particleSystem.material.uniforms.uSecondaryColor.value.set(e.target.value));

        const shockwaveBtn = document.getElementById('shockwave-btn');
        if (shockwaveBtn) {
            shockwaveBtn.addEventListener('click', () => this.particleSystem.triggerShockwave());
        }

        const audioBtn = document.getElementById('audio-toggle-btn');
        if (audioBtn) {
            audioBtn.addEventListener('click', async () => {
                const active = await this.audio.toggleMicrophone();
                audioBtn.classList.toggle('active', active);
            });
        }

        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.recorder.toggleRecording());
        }

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.particleSystem.reset());

        const collapseBtn = document.getElementById('collapse-btn');
        const controlPanel = document.querySelector('.control-panel');
        if (collapseBtn && controlPanel) {
            collapseBtn.addEventListener('click', () => {
                controlPanel.classList.toggle('collapsed');
            });
        }
    }

    setupSlider(id, displayId, callback) {
        const slider = document.getElementById(id);
        const display = document.getElementById(displayId);
        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                callback(val);
                if (display) display.textContent = val.toFixed(1);
            });
        }
    }

    setupHotkeys() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.particleSystem.triggerShockwave();
                    break;
                case 'r':
                    this.recorder.toggleRecording();
                    break;
                case 'm':
                    this.audio.toggleMicrophone();
                    break;
                case 'c':
                    if (app && app.handTracking) app.handTracking.toggleCamera();
                    break;
                case '1': this.particleSystem.applyTemplate('galaxy'); break;
                case '2': this.particleSystem.applyTemplate('blackhole'); break;
                case '3': this.particleSystem.applyTemplate('saturn'); break;
                case '4': this.particleSystem.applyTemplate('dna'); break;
                case '5': this.particleSystem.applyTemplate('heart'); break;
                case '6': this.particleSystem.applyTemplate('flower'); break;
                case '7': this.particleSystem.applyTemplate('wave'); break;
                case '8': this.particleSystem.applyTemplate('sphere'); break;
            }
        });
    }

    hideLoadingScreen() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.classList.add('hidden');
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
        this.recorder = null;
        this.audio = null;
        this.isRunning = false;
        this.lastTime = 0;
    }

    async initialize() {
        try {
            this.particleSystem = new ParticleSystem(this.state);
            this.particleSystem.initialize();

            this.audio = new AudioEngine(this.state);
            this.recorder = new StudioRecorder(this.particleSystem.renderer.domElement, this.state);
            this.uiManager = new UIManager(this.state, this.particleSystem, this.recorder, this.audio);

            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();

            this.uiManager.hideLoadingScreen();

            this.handTracking = new HandTrackingManager(this.state, this.particleSystem);
            this.handTracking.initialize().catch(() => {});
        } catch (err) {
            console.error('Initialization error:', err);
            if (this.uiManager) this.uiManager.hideLoadingScreen();
        }
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.audio) this.audio.update();
        this.particleSystem.update(deltaTime);
        this.particleSystem.render();
    }
}

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

export default AetherisApp;
