# Mini-Map Feature Implementation

## 🗺️ Overview

Added a mini-map (overview map) in the bottom-right corner, similar to strategy/open-world games, that shows:
- Full graph overview with all nodes
- Current viewport position (blue rectangle)
- Click-to-navigate functionality

## 📍 Location

Bottom-right corner, 200x150px

## ✨ Features

### 1. **Full Graph Overview**
- Shows all filtered nodes as small dots (2px radius)
- Colored by category (VAE, GAN, Diffusion, etc.)
- Shows links with reduced opacity
- Updates automatically with filters

### 2. **Viewport Indicator**
- Blue translucent rectangle shows current view
- Updates in real-time while panning/zooming
- Helps orient within large graphs

### 3. **Click to Navigate**
- Click anywhere on minimap to jump to that area
- Smooth animated transition (500ms)
- Maintains current zoom level

### 4. **Responsive Design**
- Scales graph to fit minimap dimensions
- Auto-centers the view
- Adapts to theme (dark/light)

## 🎨 Visual Design

### Dark Mode
- Background: `rgba(30, 41, 59, 0.95)` with blur
- Border: `#334155`
- Viewport: Blue (`#38bdf8`)
- Links: Gray with low opacity

### Light Mode
- Background: `rgba(255, 255, 255, 0.95)` with blur
- Border: `#cbd5e1`
- Viewport: Sky blue (`#0ea5e9`)
- Links: Light gray

### Hover Effect
- Scales up 5% on hover
- Enhanced shadow

## 🔧 Technical Implementation

### Files Modified

1. **index.html**
```html
<div id="minimap-container" class="minimap-container">
    <svg id="minimap" class="minimap"></svg>
</div>
```

2. **styles.css**
```css
.minimap-container {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 200px;
    height: 150px;
    /* ... styling ... */
}
```

3. **graph.js**
- `setupMinimap()` - Initialize minimap SVG
- `updateMinimap()` - Render nodes and links
- `updateMinimapViewport()` - Update viewport rectangle
- `getGraphBounds()` - Calculate graph extent
- Click handler for navigation
- Integrated with tick() for updates

### Key Functions

#### `setupMinimap()`
- Creates SVG element
- Adds viewport rectangle
- Sets up click navigation

#### `updateMinimap()`
- Calculates scaling factor
- Renders nodes as small circles
- Renders links with reduced opacity
- Called during simulation updates

#### `updateMinimapViewport()`
- Calculates viewport position/size
- Updates rectangle based on current zoom/pan
- Called on every zoom/pan event

#### `getGraphBounds()`
- Finds min/max X and Y of all nodes
- Used for scaling minimap correctly

## 🎮 User Interaction

### Pan & Zoom
1. User pans/zooms main graph
2. Minimap viewport rectangle updates in real-time
3. Shows current position context

### Click Navigation
1. User clicks minimap at desired location
2. Main view smoothly pans to that position
3. Zoom level maintained

### Performance
- Throttled updates during simulation (100ms)
- Final update when simulation settles
- Lightweight rendering (2px circles, thin lines)

## 📊 Performance Optimization

1. **Throttled Updates**: Minimap updates max every 100ms during active simulation
2. **Simplified Rendering**: Nodes are 2px circles (vs full detail in main view)
3. **Reduced Opacity**: Links barely visible to reduce visual clutter
4. **Final Polish**: One final update when simulation settles

## 🎯 Use Cases

### 1. **Large Graphs**
When viewing 40+ models, easy to lose orientation. Minimap shows full context.

### 2. **Navigation**
Quick jump to distant clusters without manual panning.

### 3. **Presentations**
Show audience where you are in the overall graph structure.

### 4. **Exploration**
See graph structure at a glance before diving into details.

## 🔮 Future Enhancements (Optional)

- [ ] Toggle minimap visibility
- [ ] Drag viewport rectangle to pan
- [ ] Highlight clusters on minimap
- [ ] Show selected node with special marker
- [ ] Configurable minimap size
- [ ] Minimap position options (all 4 corners)

## 🐛 Known Limitations

1. Minimap updates are slightly delayed during rapid panning (by design for performance)
2. Very large graphs (100+ nodes) may have overlapping dots in minimap
3. Minimap click navigation uses simple center-to-point panning (not exact click position)

## ✅ Testing Checklist

- [x] Minimap renders on page load
- [x] Shows all nodes and links
- [x] Viewport rectangle appears
- [x] Rectangle updates when panning
- [x] Rectangle updates when zooming
- [x] Click navigation works
- [x] Smooth transition on click
- [x] Updates when filters change
- [x] Theme toggle works (dark/light)
- [x] Hover effect works
- [x] No performance issues

## 🎓 Inspiration

Similar to minimap implementations in:
- **Age of Empires** - RTS games overview
- **The Witcher 3** - World map navigation
- **StarCraft** - Strategic overview
- **VS Code** - Code minimap scrollbar

## 📝 Code Example

```javascript
// Click navigation implementation
this.minimapSvg.on('click', (event) => {
    const [mx, my] = d3.pointer(event);
    const bounds = this.getGraphBounds();
    const scale = calculateScale(bounds);
    
    // Convert minimap coords to graph coords
    const graphX = (mx / scale) + bounds.minX;
    const graphY = (my / scale) + bounds.minY;
    
    // Pan main view to clicked position
    const newTransform = d3.zoomIdentity
        .translate(width/2 - graphX * zoom, height/2 - graphY * zoom)
        .scale(zoom);
    
    svg.transition().duration(500)
        .call(zoomBehavior.transform, newTransform);
});
```

---

**Status**: ✅ Implemented and ready for testing

**Impact**: Significantly improves navigation and orientation in large knowledge graphs
