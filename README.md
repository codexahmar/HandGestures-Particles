# AETHERIS - Interactive 3D Particle System

A professional, modern galactic UI particle system built with Three.js and MediaPipe hand tracking. Experience beautiful particle formations controlled by intuitive hand gestures.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎨 Visual Effects
- **9 Stunning Templates**: Galaxy, Heart, Flower, Saturn, Fireworks, Spiral, Wave, DNA Helix, Torus
- **Custom Shaders**: Advanced GLSL shaders for smooth animations and glowing effects
- **Real-time Morphing**: Seamless transitions between particle formations
- **Dynamic Coloring**: Multiple color pickers with random palette generator
- **Glow Effects**: Adjustable particle glow intensity
- **Motion Trails**: Optional particle trail effects

### 👋 Hand Gesture Control
- **Open Palm** - Expand particle system
- **Closed Fist** - Contract particles
- **Pinch** - Cycle through colors
- **Swipe Left/Right** - Change templates

### 🎛️ Interactive Controls
- Template selector with visual previews
- Glow intensity slider (0.3 - 3.0)
- Particle size control (0.1 - 5.0)
- Animation speed adjustment (0.1 - 3.0)
- Three color pickers for custom palettes
- Auto-rotation toggle
- Motion trails toggle
- Bloom effect toggle

### 🖥️ User Interface
- **Professional Glass-morphism Design**
- **Collapsible Control Panel**
- **Real-time FPS Counter**
- **Particle Count Display**
- **Hand Tracking Status Indicator**
- **Live Video Preview**
- **Responsive Design** for mobile and desktop

### 📸 Additional Features
- Screenshot capture
- Fullscreen mode
- Mouse parallax effect
- Keyboard navigation support
- Loading screen with animations

## 📁 Project Structure

```
Threejs/
├── index-new.html      # Main HTML file
├── styles.css          # Modern galactic UI styles
├── config.js           # Configuration and state management
├── shaders.js          # GLSL shader definitions
├── templates.js        # Particle formation templates
├── handTracking.js     # MediaPipe hand tracking integration
├── main.js             # Main application logic
└── README.md           # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser with WebGL support
- Webcam (for hand tracking features)
- HTTPS or localhost (required for camera access)

### Installation

1. **Clone or download** this repository

2. **Serve the files** using a local web server:

   ```bash
   # Option 1: Using Python
   python -m http.server 8000
   
   # Option 2: Using Node.js http-server
   npx http-server
   
   # Option 3: Using PHP
   php -S localhost:8000
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:8000/index-new.html
   ```

4. **Allow camera access** when prompted (for hand tracking)

### Quick Start (No Server)

Open `index-new.html` directly in your browser. Note: Hand tracking requires HTTPS or localhost.

## 🎮 Usage Guide

### Basic Controls

#### Template Selection
Use the dropdown menu to choose from 9 particle formations:
- 🌌 Galaxy Spiral - Classic spiral galaxy formation
- 💫 Heart Nebula - Romantic heart shape
- 🌸 Quantum Flower - Fibonacci spiral pattern
- 🪐 Saturn System - Planet with ring system
- ✨ Fireworks - Explosive burst pattern
- 🌀 Golden Spiral - Archimedean spiral
- 〰️ Wave Grid - Undulating 3D grid
- 🧬 DNA Helix - Double helix structure
- ⭕ Torus Ring - Donut-shaped formation

#### Sliders
- **Glow Intensity**: Adjust particle brightness
- **Particle Scale**: Change particle size
- **Animation Speed**: Control animation playback speed

#### Colors
- Click color pickers to choose custom colors
- Click 🎲 button for random color palette

#### Toggles
- **Auto-Rotation**: Enable/disable automatic rotation
- **Motion Trails**: Add trailing effect to particles
- **Bloom Effect**: Enhanced glow rendering

### Hand Gestures

Make sure your hand is visible to the camera:

1. **Open Palm** 👋
   - Spreads particles outward
   - Increases particle size
   - Creates expansive effect

2. **Closed Fist** ✊
   - Contracts particles inward
   - Decreases particle size
   - Changes to cool color palette

3. **Pinch** 🤏
   - Touch thumb and index finger
   - Cycles through color spectrum
   - Creates rainbow effect

4. **Swipe** 👈👉
   - Move hand left or right quickly
   - Changes to next/previous template
   - Has cooldown to prevent rapid switching

### Keyboard Shortcuts

- **F11**: Toggle fullscreen
- **Esc**: Exit fullscreen

### Action Buttons

- **⟲ Reset System**: Return to default state
- **📷 Screenshot**: Capture current view
- **⛶ Fullscreen**: Enter/exit fullscreen mode

## 🔧 Configuration

### Customizing Particle Count

Edit `config.js`:
```javascript
particles: {
    count: 15000,  // Change this value
    // ...
}
```

### Adjusting Hand Tracking Sensitivity

Edit `config.js`:
```javascript
handTracking: {
    swipeThreshold: 0.1,      // Lower = more sensitive
    pinchThreshold: 0.05,     // Lower = more sensitive
    openPalmThreshold: 0.4,   // Adjust palm detection
    // ...
}
```

### Adding New Templates

Edit `templates.js`:
```javascript
export function customTemplate(i, total) {
    // Your particle positioning logic
    const x = /* ... */;
    const y = /* ... */;
    const z = /* ... */;
    return [x, y, z];
}

// Add to templates object
export const templates = {
    // ... existing templates
    custom: customTemplate
};
```

## 🎨 Customizing the UI

### Changing Color Scheme

Edit CSS variables in `styles.css`:
```css
:root {
    --color-primary: #00f2ff;     /* Cyan */
    --color-secondary: #ff00ff;   /* Magenta */
    --color-accent: #ffaa00;      /* Orange */
    /* ... */
}
```

### Modifying Panel Position

Edit `.control-panel` in `styles.css`:
```css
.control-panel {
    top: 90px;     /* Adjust vertical position */
    right: 24px;   /* Adjust horizontal position */
    /* ... */
}
```

## 🔬 Technical Details

### Technologies Used
- **Three.js** (0.160.0) - 3D graphics library
- **MediaPipe Hands** - Hand tracking ML model
- **GLSL** - Custom vertex and fragment shaders
- **WebGL** - Hardware-accelerated rendering
- **ES6 Modules** - Modern JavaScript architecture

### Browser Compatibility
- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+
- Opera 76+

### Performance
- Optimized for 60 FPS
- Dynamic LOD (Level of Detail)
- Efficient particle pooling
- Smooth interpolation algorithms

## 🐛 Troubleshooting

### Camera Not Working
- Ensure HTTPS or localhost
- Check browser camera permissions
- Try different browser
- Verify webcam is not in use

### Low FPS
- Reduce particle count in `config.js`
- Lower browser window size
- Disable motion trails
- Close other applications

### Particles Not Visible
- Check browser WebGL support
- Update graphics drivers
- Try different browser
- Clear browser cache

### Hand Tracking Not Responding
- Improve lighting conditions
- Move closer to camera
- Reduce background clutter
- Ensure hand is fully visible

## 📱 Mobile Support

The interface is fully responsive and works on mobile devices:
- Touch-optimized controls
- Adapted layout for small screens
- Virtual camera fallback
- Gesture alternative controls

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional particle templates
- New gesture controls
- Performance optimizations
- UI enhancements
- Documentation improvements

## 📄 License

MIT License - Feel free to use in personal and commercial projects

## 🙏 Acknowledgments

- Three.js community
- MediaPipe team
- WebGL specification authors
- Open source contributors

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check documentation
- Review troubleshooting section

## 🗺️ Roadmap

- [ ] VR/AR support
- [ ] Audio reactivity
- [ ] Particle physics simulations
- [ ] Export/import presets
- [ ] Multi-hand tracking
- [ ] Touch gesture alternatives
- [ ] WebGPU renderer option

---

**Built with ❤️ for the WebGL community**

*Version 2.0.0 - Professional Modern Galactic UI Edition*
