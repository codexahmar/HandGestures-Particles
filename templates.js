// ========================================
// AETHERIS - Particle Templates Module
// ========================================

/**
 * Particle Template Generators
 * Each function generates position coordinates for a particle based on index
 */

/**
 * Galaxy Spiral
 * Creates a spiral galaxy with multiple arms
 */
export function galaxyTemplate(i, total) {
    const r = Math.pow(Math.random(), 0.5) * 6;
    const theta = Math.random() * Math.PI * 2;
    const armOffset = Math.floor(Math.random() * 3) * (Math.PI * 2 / 3);
    const finalTheta = theta + armOffset;

    return [
        r * Math.cos(finalTheta),
        (Math.random() - 0.5) * 0.5 * (1 - r / 6),
        r * Math.sin(finalTheta)
    ];
}

/**
 * Heart Nebula
 * Creates a 3D heart shape
 */
export function heartTemplate(i, total) {
    const t = (i / total) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const z = (Math.random() - 0.5) * 1.5;

    return [x * 0.15, y * 0.15, z];
}

/**
 * Quantum Flower
 * Creates a flower pattern with Fibonacci spiral
 */
export function flowerTemplate(i, total) {
    const angle = i * 0.1 * 2.39996; // Golden angle
    const r = 0.05 * Math.sqrt(i);
    const z = Math.sin(r * 2) * 2;

    return [
        r * Math.cos(angle),
        r * Math.sin(angle),
        z
    ];
}

/**
 * Saturn System
 * Creates a spherical planet with ring system
 */
export function saturnTemplate(i, total) {
    const ringThreshold = total * 0.6;

    if (i < ringThreshold) {
        // Planet sphere
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const r = 2.5;

        return [
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        ];
    } else {
        // Ring system
        const r = 3.5 + Math.random() * 1.5;
        const theta = Math.random() * Math.PI * 2;
        const wobble = Math.sin(theta * 8) * 0.1;

        return [
            r * Math.cos(theta),
            (Math.random() - 0.5) * 0.2 + wobble,
            r * Math.sin(theta)
        ];
    }
}

/**
 * Fireworks Burst
 * Creates an explosive spherical distribution
 */
export function fireworksTemplate(i, total) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.2) * 5;

    return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    ];
}

/**
 * Golden Spiral
 * Creates an Archimedean spiral
 */
export function spiralTemplate(i, total) {
    const a = 0.1;
    const b = 0.1;
    const angle = 0.1 * i;
    const x = (a + b * angle) * Math.cos(angle);
    const y = (a + b * angle) * Math.sin(angle);
    const z = (i / total) * 4 - 2;

    return [x * 0.2, y * 0.2, z];
}

/**
 * Wave Grid
 * Creates an undulating 3D grid
 */
export function waveTemplate(i, total) {
    const size = Math.ceil(Math.sqrt(total));
    const x = (i % size) - size / 2;
    const y = Math.floor(i / size) - (total / size) / 2;
    const z = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 2;

    return [x * 0.2, z, y * 0.2];
}

/**
 * DNA Helix
 * Creates a double helix structure
 */
export function dnaTemplate(i, total) {
    const t = (i / total) * Math.PI * 8;
    const radius = 1.5;
    const height = (i / total) * 10 - 5;

    // Alternate between two helices
    const helix = i % 2;
    const offset = helix * Math.PI;

    return [
        radius * Math.cos(t + offset),
        height,
        radius * Math.sin(t + offset)
    ];
}

/**
 * Torus Ring
 * Creates a torus (donut) shape
 */
export function torusTemplate(i, total) {
    const u = (i / total) * Math.PI * 2;
    const v = ((i * 7) % total / total) * Math.PI * 2;
    const R = 3; // Major radius
    const r = 1; // Minor radius

    return [
        (R + r * Math.cos(v)) * Math.cos(u),
        r * Math.sin(v),
        (R + r * Math.cos(v)) * Math.sin(u)
    ];
}

/**
 * Template Registry
 * Maps template names to generator functions
 */
export const templates = {
    galaxy: galaxyTemplate,
    heart: heartTemplate,
    flower: flowerTemplate,
    saturn: saturnTemplate,
    fireworks: fireworksTemplate,
    spiral: spiralTemplate,
    wave: waveTemplate,
    dna: dnaTemplate,
    torus: torusTemplate
};

/**
 * Get list of template names
 */
export function getTemplateNames() {
    return Object.keys(templates);
}

/**
 * Get template by name
 */
export function getTemplate(name) {
    return templates[name] || templates.galaxy;
}

/**
 * Generate random color for particle
 */
export function generateParticleColor(i, total, baseColor) {
    const hue = (i / total) * 360;
    const saturation = 0.6 + Math.random() * 0.4;
    const lightness = 0.4 + Math.random() * 0.3;

    return {
        r: saturation,
        g: lightness,
        b: Math.random()
    };
}

/**
 * Get next template in sequence
 */
export function getNextTemplate(currentName) {
    const names = getTemplateNames();
    const currentIndex = names.indexOf(currentName);
    const nextIndex = (currentIndex + 1) % names.length;
    return names[nextIndex];
}

/**
 * Get previous template in sequence
 */
export function getPreviousTemplate(currentName) {
    const names = getTemplateNames();
    const currentIndex = names.indexOf(currentName);
    const prevIndex = (currentIndex - 1 + names.length) % names.length;
    return names[prevIndex];
}

export default {
    templates,
    getTemplate,
    getTemplateNames,
    getNextTemplate,
    getPreviousTemplate,
    generateParticleColor
};
