// ========================================
// AETHERIS - High-Performance GLSL Shaders
// ========================================

import * as THREE from 'three';

/**
 * Optimized Vertex Shader
 * Blazing fast 60+ FPS calculations: smooth morphing, orbital motion, audio pulses, and hand displacement
 */
export const vertexShader = `
    uniform float uTime;
    uniform float uMorph;
    uniform float uPointSize;
    uniform float uExpansion;
    uniform float uSpeed;
    
    // Hand force interaction
    uniform vec3 uHandPos;
    uniform float uHandForce;
    uniform float uHandActive;
    
    // Shockwave ripple
    uniform float uShockwaveProgress;
    uniform vec3 uShockwaveOrigin;
    
    // Audio Reactivity
    uniform float uAudioBass;
    uniform float uAudioTreble;
    
    attribute vec3 targetPosition;
    attribute vec3 color;
    
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
        vColor = color;
        
        // 1. Smooth Geometric Morphing
        vec3 pos = mix(position, targetPosition, uMorph);
        
        // 2. Global Expansion
        pos *= (1.0 + uExpansion);
        
        // 3. Audio Bass Pulse
        pos *= (1.0 + uAudioBass * 0.2);
        
        // 4. Lightweight Organic Wave Motion (Zero-cost analytical wave)
        float waveTime = uTime * uSpeed * 0.7;
        pos.y += sin(waveTime + pos.x * 0.3) * (0.08 + uAudioBass * 0.1);
        pos.z += cos(waveTime + pos.y * 0.3) * (0.08 + uAudioTreble * 0.05);
        
        // 5. Hand Repulsor/Attractor Force Field
        if (uHandActive > 0.5) {
            vec3 toHand = pos - uHandPos;
            float distToHand = length(toHand);
            float radius = 5.0;
            
            if (distToHand < radius && distToHand > 0.05) {
                float force = (1.0 - distToHand / radius);
                pos += normalize(toHand) * (uHandForce * force * 2.0);
            }
        }
        
        // 6. Shockwave Ripple
        if (uShockwaveProgress < 1.0) {
            vec3 toOrigin = pos - uShockwaveOrigin;
            float dist = length(toOrigin);
            float waveR = uShockwaveProgress * 18.0;
            float diff = abs(dist - waveR);
            if (diff < 2.5) {
                float factor = (1.0 - diff / 2.5);
                pos += normalize(toOrigin) * (factor * (1.0 - uShockwaveProgress) * 2.8);
            }
        }
        
        // 7. Depth Attenuation
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float distToCam = -mvPosition.z;
        
        gl_PointSize = uPointSize * (280.0 / distToCam);
        gl_PointSize = clamp(gl_PointSize, 1.0, 48.0);
        
        // Smooth distance fog
        vAlpha = smoothstep(35.0, 4.0, length(mvPosition.xyz));
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

/**
 * Optimized Fragment Shader
 * Clean circular particles with soft luminous falloff and high performance
 */
export const fragmentShader = `
    uniform vec3 uBaseColor;
    uniform vec3 uSecondaryColor;
    uniform float uGlow;
    uniform float uAudioBass;
    
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
        // Fast circular point discard
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        
        // Soft gaussian-like falloff
        float strength = (0.5 - dist) * 2.0;
        strength = strength * strength;
        
        // Core white highlight
        float core = max(0.0, 1.0 - dist * 4.0);
        
        // Color blend
        vec3 finalColor = mix(vColor, uBaseColor, 0.4);
        finalColor = mix(finalColor, uSecondaryColor, uAudioBass * 0.3);
        
        // Luminous emissive composite
        vec3 outColor = finalColor * uGlow + vec3(core * 0.7);
        float alpha = strength * vAlpha;
        
        gl_FragColor = vec4(outColor, alpha);
    }
`;

/**
 * Generate shader uniforms object
 */
export function getShaderUniforms(config) {
    return {
        uTime: { value: 0 },
        uMorph: { value: 1.0 },
        uPointSize: { value: config.particles.defaultSize },
        uGlow: { value: config.material.defaultGlow },
        uExpansion: { value: 0 },
        uSpeed: { value: config.animation.defaultSpeed },
        
        // Hand physics
        uHandPos: { value: new THREE.Vector3(0, 0, 0) },
        uHandForce: { value: 0.0 },
        uHandActive: { value: 0.0 },
        
        // Shockwave
        uShockwaveProgress: { value: 1.0 },
        uShockwaveOrigin: { value: new THREE.Vector3(0, 0, 0) },
        
        // Audio
        uAudioBass: { value: 0.0 },
        uAudioTreble: { value: 0.0 },
        
        // Theme Colors
        uBaseColor: { value: new THREE.Color(config.material.defaultColor) },
        uSecondaryColor: { value: new THREE.Color(config.material.secondaryColor) }
    };
}

export default {
    vertexShader,
    fragmentShader,
    getShaderUniforms
};
