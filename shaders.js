// ========================================
// AETHERIS - Shader Module
// ========================================

import * as THREE from 'three';

/**
 * Vertex Shader
 * Handles particle positioning, morphing, and animation
 */
export const vertexShader = `
    uniform float uTime;
    uniform float uMorph;
    uniform float uPointSize;
    uniform float uExpansion;
    uniform float uSpeed;
    
    attribute vec3 targetPosition;
    attribute vec3 color;
    
    varying vec3 vColor;
    varying float vDistance;
    varying float vAlpha;
    
    void main() {
        vColor = color;
        
        // Morphing between current and target position
        vec3 pos = mix(position, targetPosition, uMorph);
        
        // Hand interaction: Expansion/Contraction
        pos *= (1.0 + uExpansion);
        
        // Wave motion for organic feel
        float wave = sin(uTime * uSpeed * 0.5 + pos.x * 0.2) * 0.1;
        pos.y += wave;
        pos.z += cos(uTime * uSpeed * 0.5 + pos.y * 0.2) * 0.1;
        
        // Slight rotation animation
        float angle = uTime * uSpeed * 0.1;
        float cosA = cos(angle);
        float sinA = sin(angle);
        mat2 rotation = mat2(cosA, -sinA, sinA, cosA);
        pos.xz *= rotation;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vDistance = length(mvPosition.xyz);
        
        // Distance-based size attenuation
        gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
        
        // Fade particles based on distance
        vAlpha = smoothstep(20.0, 5.0, vDistance);
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

/**
 * Fragment Shader
 * Handles particle rendering with glow and color blending
 */
export const fragmentShader = `
    uniform vec3 uBaseColor;
    uniform vec3 uSecondaryColor;
    uniform vec3 uAccentColor;
    uniform float uGlow;
    uniform float uTime;
    uniform bool uColorCycle;
    
    varying vec3 vColor;
    varying float vDistance;
    varying float vAlpha;
    
    void main() {
        // Calculate distance from center for circular particles
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        
        // Create soft edges
        float strength = pow(1.0 - d * 2.0, 2.0);
        
        // Mix colors based on distance and time
        vec3 finalColor = mix(vColor, uBaseColor, 0.4);
        
        // Add color cycling effect
        if (uColorCycle) {
            float colorMix = sin(uTime * 0.5 + vDistance * 0.5) * 0.5 + 0.5;
            finalColor = mix(finalColor, uSecondaryColor, colorMix * 0.3);
        }
        
        // Apply glow and distance-based alpha
        vec3 glowColor = finalColor * uGlow;
        float alpha = strength * vAlpha;
        
        gl_FragColor = vec4(glowColor, alpha);
    }
`;

/**
 * Enhanced Vertex Shader with Trails Effect
 */
export const vertexShaderTrails = `
    uniform float uTime;
    uniform float uMorph;
    uniform float uPointSize;
    uniform float uExpansion;
    uniform float uSpeed;
    uniform float uTrailLength;
    
    attribute vec3 targetPosition;
    attribute vec3 color;
    attribute float offset;
    
    varying vec3 vColor;
    varying float vDistance;
    varying float vAlpha;
    varying float vTrailAlpha;
    
    void main() {
        vColor = color;
        
        vec3 pos = mix(position, targetPosition, uMorph);
        pos *= (1.0 + uExpansion);
        
        // Trail effect - offset particles in time
        float timeOffset = uTime - offset * uTrailLength;
        pos.y += sin(timeOffset * uSpeed * 0.5 + pos.x * 0.2) * 0.1;
        pos.z += cos(timeOffset * uSpeed * 0.5 + pos.y * 0.2) * 0.1;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vDistance = length(mvPosition.xyz);
        
        gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
        
        vAlpha = smoothstep(20.0, 5.0, vDistance);
        vTrailAlpha = 1.0 - (offset / uTrailLength);
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

/**
 * Get shader configuration
 */
export function getShaderUniforms(config) {
    return {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uPointSize: { value: config.particles.defaultSize },
        uGlow: { value: config.material.defaultGlow },
        uExpansion: { value: 0 },
        uSpeed: { value: config.animation.defaultSpeed },
        uBaseColor: { value: new THREE.Color(config.material.defaultColor) },
        uSecondaryColor: { value: new THREE.Color(0xff00ff) },
        uAccentColor: { value: new THREE.Color(0xffaa00) },
        uColorCycle: { value: false },
        uTrailLength: { value: 2.0 }
    };
}

export default {
    vertexShader,
    fragmentShader,
    vertexShaderTrails,
    getShaderUniforms
};
