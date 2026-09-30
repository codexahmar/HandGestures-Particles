// ========================================
// AETHERIS - Geometry Templates Module
// ========================================

/**
 * 1. Logarithmic Spiral Galaxy
 */
export function galaxyTemplate(i, total) {
    const arms = 3;
    const arm = i % arms;
    const armAngle = (arm * 2 * Math.PI) / arms;
    const dist = Math.pow(Math.random(), 0.6) * 6.5;
    const spiral = dist * 0.8 + armAngle;

    const isCore = Math.random() < 0.2;
    if (isCore) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 0.5) * 1.4;
        return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.7, r * Math.sin(phi) * Math.sin(theta)];
    }

    const spread = (dist / 6.5) * 0.35;
    const x = dist * Math.cos(spiral) + (Math.random() - 0.5) * spread * 1.5;
    const z = dist * Math.sin(spiral) + (Math.random() - 0.5) * spread * 1.5;
    const y = (Math.random() - 0.5) * 0.35;
    return [x, y, z];
}

/**
 * 2. Gargantua Black Hole (Accretion Disk & Photon Ring)
 */
export function blackHoleTemplate(i, total) {
    const ratio = i / total;
    if (ratio < 0.7) {
        const r = 2.0 + Math.pow(Math.random(), 0.6) * 5.0;
        const theta = Math.random() * Math.PI * 2;
        const thickness = (1.0 - (r - 2.0) / 5.0) * 0.2;
        return [r * Math.cos(theta), (Math.random() - 0.5) * thickness, r * Math.sin(theta)];
    } else {
        const theta = Math.random() * Math.PI * 2;
        const r = 1.8 + Math.random() * 0.4;
        return [r * Math.cos(theta), (Math.random() - 0.5) * 0.1, r * Math.sin(theta)];
    }
}

/**
 * 3. Saturn Planetary System
 */
export function saturnTemplate(i, total) {
    const isPlanet = i < total * 0.45;
    if (isPlanet) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const r = 2.2;
        return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.88, r * Math.sin(phi) * Math.sin(theta)];
    } else {
        const r = 3.2 + Math.random() * 3.2;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = (Math.random() - 0.5) * 0.08;
        const tilt = 0.45;
        return [x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
    }
}

/**
 * 4. DNA Double Helix
 */
export function dnaTemplate(i, total) {
    const turns = 4;
    const height = 8.5;
    const t = i / total;
    const angle = t * Math.PI * 2 * turns;
    const y = (t - 0.5) * height;
    const radius = 1.8;
    const isStrandA = (i % 2 === 0);

    return [
        radius * Math.cos(angle + (isStrandA ? 0 : Math.PI)),
        y,
        radius * Math.sin(angle + (isStrandA ? 0 : Math.PI))
    ];
}

/**
 * 5. Heart Nebula
 */
export function heartTemplate(i, total) {
    const t = Math.random() * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const scale = 0.2;
    const z = (Math.random() - 0.5) * 1.5;
    return [x * scale, y * scale + 0.4, z];
}

/**
 * 6. Quantum Lotus
 */
export function flowerTemplate(i, total) {
    const phi = 1.6180339887;
    const angle = i * phi * Math.PI * 2;
    const r = Math.sqrt(i / total) * 4.8;
    const z = Math.sin(r * 2.0) * 1.0;
    return [r * Math.cos(angle), z, r * Math.sin(angle)];
}

/**
 * 7. Kinetic Wave Grid
 */
export function waveTemplate(i, total) {
    const size = Math.ceil(Math.sqrt(total));
    const x = (i % size) - size / 2;
    const z = Math.floor(i / size) - size / 2;
    const dist = Math.hypot(x, z) * 0.14;
    const y = Math.sin(dist * 2.8) * 1.4;
    return [x * 0.22, y, z * 0.22];
}

/**
 * 8. Celestial Sphere
 */
export function sphereTemplate(i, total) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 3.2;
    return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

export const templates = {
    galaxy: galaxyTemplate,
    blackhole: blackHoleTemplate,
    saturn: saturnTemplate,
    dna: dnaTemplate,
    heart: heartTemplate,
    flower: flowerTemplate,
    wave: waveTemplate,
    sphere: sphereTemplate
};

export const templateColorPresets = {
    galaxy: { primary: '#38bdf8', secondary: '#818cf8' },
    blackhole: { primary: '#06b6d4', secondary: '#f97316' },
    saturn: { primary: '#fbbf24', secondary: '#f43f5e' },
    dna: { primary: '#34d399', secondary: '#60a5fa' },
    heart: { primary: '#fb7185', secondary: '#f43f5e' },
    flower: { primary: '#e879f9', secondary: '#818cf8' },
    wave: { primary: '#22d3ee', secondary: '#38bdf8' },
    sphere: { primary: '#a78bfa', secondary: '#38bdf8' }
};

export function getTemplateNames() {
    return Object.keys(templates);
}

export function getTemplate(name) {
    return templates[name] || templates.galaxy;
}

export function getNextTemplate(currentName) {
    const names = getTemplateNames();
    const idx = names.indexOf(currentName);
    return names[(idx + 1) % names.length];
}

export function getPreviousTemplate(currentName) {
    const names = getTemplateNames();
    const idx = names.indexOf(currentName);
    return names[(idx - 1 + names.length) % names.length];
}

export default {
    templates,
    getTemplate,
    getTemplateNames,
    templateColorPresets,
    getNextTemplate,
    getPreviousTemplate
};
