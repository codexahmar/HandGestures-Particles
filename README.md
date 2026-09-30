# Aetheris — Interactive 3D Particle Engine

A high-performance interactive 3D particle simulation engine with real-time hand gesture tracking. Built with **Three.js**, **GLSL Shaders**, **MediaPipe Vision**, and the **Web Audio API**.

Designed with a clean, professional dark UI and optimized for smooth 60 FPS performance.

---

## Features

- **High-Performance 3D Simulation**: 8,000 particles running at a stable 60 FPS with zero lag or GPU bottleneck.
- **8 Mathematical Geometry Templates**: Galaxy Spiral, Black Hole Accretion, Saturn System, DNA Helix, Heart Nebula, Quantum Lotus, Wave Field, and Celestial Sphere.
- **Real-Time Hand Tracking**: Powered by MediaPipe Hands (Lite model) with motion gesture control and subtle skeletal HUD overlay.
- **Gesture Vocabulary**:
  - **Open Palm**: Expands particle field.
  - **Fist (Hold)**: Contracts particles into an attractor core.
  - **Release Fist**: Releases a smooth shockwave ripple through space.
  - **Pinch**: Smooth color shift.
  - **Swipe**: Switches to next/previous geometry.
- **Audio Reactivity**: Real-time microphone audio spectrum analysis modulating particle vibrations and color tones.
- **Direct Video Recording**: One-click 60 FPS canvas capture with instant `.webm` export.
- **Professional Minimalist Interface**: Dark slate/obsidian palette, Inter typography, clean sliders, and uncluttered controls.

---

## Keyboard Shortcuts

| Shortcut | Action |
|:---:|:---|
| <kbd>SPACE</kbd> | Trigger Shockwave Ripple |
| <kbd>1</kbd> – <kbd>8</kbd> | Switch Geometry Template |
| <kbd>R</kbd> | Start / Stop Video Recording |
| <kbd>M</kbd> | Toggle Audio Reactivity (Microphone) |
| <kbd>C</kbd> | Toggle Camera Preview |

---

## Project Structure

```
HandGestures-Particles/
├── index.html       # Clean application markup & layout
├── styles.css       # Professional minimalist dark theme
├── config.js        # Engine configuration & state (8,000 particles, lite model)
├── shaders.js       # Fast GLSL vertex & fragment shaders
├── templates.js     # Mathematical 3D geometry generators
├── handTracking.js  # MediaPipe Vision hand tracking integration
├── main.js          # Core engine loop, audio & recorder managers
└── README.md        # Documentation
```

---

## Running Locally

Serve the directory with any static HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve .
```

Open `http://localhost:8000` in your browser. Camera permissions are required for hand tracking.
