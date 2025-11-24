/**
 * OpenScan Logo Generator
 * Generates an SVG logo with a green "O" ring filled with tessellated isometric cubes
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  canvas: 512,
  outerRadius: 256,
  innerRadius: 190,
  ringColor: '#10b981',
  innerBackground: '#0f172a',
  cubeSize: 24, // Uniform cube size
  strokeColor: '#64748b', // Subtle stroke for cube edges
  strokeWidth: 0.5,
};

// Network colors with their 3D face variations
const NETWORKS = [
  { name: 'ethereum', top: '#627EEA', left: '#5469c7', right: '#4254a4' },
  { name: 'hardhat', top: '#FFF100', left: '#d9cd00', right: '#b3a900' },
  { name: 'arbitrum', top: '#28A0F0', left: '#2288cc', right: '#1c70a8' },
  { name: 'optimism', top: '#FF0420', left: '#d9031b', right: '#b30316' },
  { name: 'base', top: '#0052FF', left: '#0046d9', right: '#003ab3' },
];

// Generate isometric cube SVG at grid position
function generateIsometricCube(x, y, size, colors) {
  const h = size * 0.5; // Height factor for isometric
  const w = size * 0.866; // Width factor (cos 30°)

  const strokeAttr = `stroke="${CONFIG.strokeColor}" stroke-width="${CONFIG.strokeWidth}"`;

  // Top face (diamond shape)
  const top = `
    <polygon 
      points="${x},${y - h} ${x + w},${y - h / 2} ${x},${y} ${x - w},${y - h / 2}"
      fill="${colors.top}"
      ${strokeAttr}
    />`;

  // Left face
  const left = `
    <polygon 
      points="${x - w},${y - h / 2} ${x},${y} ${x},${y + h} ${x - w},${y + h / 2}"
      fill="${colors.left}"
      ${strokeAttr}
    />`;

  // Right face
  const right = `
    <polygon 
      points="${x},${y} ${x + w},${y - h / 2} ${x + w},${y + h / 2} ${x},${y + h}"
      fill="${colors.right}"
      ${strokeAttr}
    />`;

  return `<g>${top}${left}${right}</g>`;
}

// Check if point is inside circle
function isInsideCircle(x, y, cx, cy, radius) {
  const dx = x - cx;
  const dy = y - cy;
  return Math.sqrt(dx * dx + dy * dy) < radius;
}

// Check if cube center is close enough to be visible in circle (with margin for partial cubes)
function isCubeNearCircle(x, y, size, cx, cy, radius) {
  // Include cubes that overlap with the circle (center within radius + cube size)
  return isInsideCircle(x, y, cx, cy, radius + size);
}

// Generate tessellated grid of cubes
function generateCubes() {
  const cx = CONFIG.canvas / 2;
  const cy = CONFIG.canvas / 2;
  const radius = CONFIG.innerRadius;
  const size = CONFIG.cubeSize;
  
  const cubes = [];
  
  // Isometric grid spacing
  const h = size * 0.5;
  const w = size * 0.866;
  
  // Grid step sizes for tessellation
  const stepX = w * 2; // Horizontal spacing between cubes in same row
  const stepY = h * 1.5; // Vertical spacing between rows
  
  // Calculate grid bounds
  const gridSize = Math.ceil(radius * 2 / Math.min(stepX, stepY)) + 4;
  
  // Generate grid
  for (let row = -gridSize; row <= gridSize; row++) {
    for (let col = -gridSize; col <= gridSize; col++) {
      // Offset every other row for tessellation
      const offsetX = (row % 2) * w;
      
      const x = cx + col * stepX + offsetX;
      const y = cy + row * stepY;
      
      // Include cube if it overlaps with circle (clip-path will handle edges)
      if (isCubeNearCircle(x, y, size, cx, cy, radius)) {
        // Assign color based on position (deterministic but varied)
        const colorIndex = Math.abs((row * 7 + col * 13) % NETWORKS.length);
        const colors = NETWORKS[colorIndex];
        
        cubes.push({
          x,
          y,
          size,
          colors: {
            top: colors.top,
            left: colors.left,
            right: colors.right,
          },
        });
      }
    }
  }
  
  // Sort by Y position for proper layering
  cubes.sort((a, b) => a.y - b.y);
  
  return cubes;
}

// Generate SVG
function generateSVG() {
  const cx = CONFIG.canvas / 2;
  const cy = CONFIG.canvas / 2;

  const cubes = generateCubes();
  const cubesSVG = cubes
    .map((cube) => generateIsometricCube(cube.x, cube.y, cube.size, cube.colors))
    .join('\n    ');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  width="${CONFIG.canvas}" 
  height="${CONFIG.canvas}" 
  viewBox="0 0 ${CONFIG.canvas} ${CONFIG.canvas}"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <clipPath id="innerCircle">
      <circle cx="${cx}" cy="${cy}" r="${CONFIG.innerRadius}" />
    </clipPath>
  </defs>

  <!-- Outer green ring (Capital O) -->
  <circle 
    cx="${cx}" 
    cy="${cy}" 
    r="${CONFIG.outerRadius}" 
    fill="${CONFIG.ringColor}"
  />

  <!-- Dark inner background -->
  <circle 
    cx="${cx}" 
    cy="${cy}" 
    r="${CONFIG.innerRadius}" 
    fill="${CONFIG.innerBackground}"
  />

  <!-- Cubes (clipped to inner circle) -->
  <g clip-path="url(#innerCircle)">
    ${cubesSVG}
  </g>
</svg>`;

  return svg;
}

// Main
function main() {
  console.log('Generating OpenScan logo...');
  
  const svg = generateSVG();
  const outputPath = path.join(__dirname, '..', 'public', 'openscan-logo.svg');
  
  fs.writeFileSync(outputPath, svg);
  console.log(`Logo saved to: ${outputPath}`);
  
  // Also save to src/assets
  const assetsPath = path.join(__dirname, '..', 'src', 'assets', 'openscan-logo.svg');
  fs.writeFileSync(assetsPath, svg);
  console.log(`Logo also saved to: ${assetsPath}`);
}

main();
