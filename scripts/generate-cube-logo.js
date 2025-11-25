/**
 * OpenScan Cube Logo Generator
 * Generates a simple isometric cube SVG logo with network colors
 * - Top face: Ethereum blue (#627EEA)
 * - Left face: Hardhat yellow (#FFF100)
 * - Right face: Dark green (#065743)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  canvas: 512,
  cubeSize: 400, // Size of the cube
  // Network colors for the cube faces
  topColor: '#627EEA',    // Ethereum blue (brightest)
  leftColor: '#FFF100',   // Hardhat yellow (medium)
  rightColor: '#065743',  // Dark green (darkest)
  strokeColor: '#1f2937',
  strokeWidth: 2,
};

// Generate the cube SVG - uses same proportions as navbar home cube
function generateCubeSVG() {
  const canvas = CONFIG.canvas;
  const scale = canvas / 36; // Scale factor from original 36x36 viewBox
  
  // Original points from navbar home cube (viewBox 36x36):
  // Top: "20,6 34,14 20,22 6,14"
  // Left: "6,14 20,22 20,36 6,28"
  // Right: "20,22 34,14 34,28 20,36"
  
  // The original cube center is at (20, 21), we need to offset to center it
  // Canvas center is at (256, 256) for 512px canvas
  // Original cube spans x: 6-34 (width 28), y: 6-36 (height 30)
  // Center of original cube: x=20, y=21
  // We want center at canvas/2, so offset = canvas/2 - original_center * scale
  const offsetX = (canvas / 2) - (20 * scale);
  const offsetY = (canvas / 2) - (21 * scale);
  
  // Scale and offset the points to center the cube
  const topPoints = `${20*scale + offsetX},${6*scale + offsetY} ${34*scale + offsetX},${14*scale + offsetY} ${20*scale + offsetX},${22*scale + offsetY} ${6*scale + offsetX},${14*scale + offsetY}`;
  const leftPoints = `${6*scale + offsetX},${14*scale + offsetY} ${20*scale + offsetX},${22*scale + offsetY} ${20*scale + offsetX},${36*scale + offsetY} ${6*scale + offsetX},${28*scale + offsetY}`;
  const rightPoints = `${20*scale + offsetX},${22*scale + offsetY} ${34*scale + offsetX},${14*scale + offsetY} ${34*scale + offsetX},${28*scale + offsetY} ${20*scale + offsetX},${36*scale + offsetY}`;

  const strokeAttr = CONFIG.strokeWidth > 0 
    ? `stroke="${CONFIG.strokeColor}" stroke-width="${CONFIG.strokeWidth}" stroke-linejoin="round"`
    : '';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  width="${CONFIG.canvas}" 
  height="${CONFIG.canvas}" 
  viewBox="0 0 ${CONFIG.canvas} ${CONFIG.canvas}"
  xmlns="http://www.w3.org/2000/svg"
>
  <!-- Isometric Cube Logo -->
  <g>
    <!-- Right face - dark green (darkest) -->
    <polygon
      points="${rightPoints}"
      fill="${CONFIG.rightColor}"
      ${strokeAttr}
    />
    <!-- Left face - Hardhat yellow (medium) -->
    <polygon
      points="${leftPoints}"
      fill="${CONFIG.leftColor}"
      ${strokeAttr}
    />
    <!-- Top face - Ethereum blue (brightest) -->
    <polygon
      points="${topPoints}"
      fill="${CONFIG.topColor}"
      ${strokeAttr}
    />
  </g>
</svg>`;

  return svg;
}

// Generate a smaller favicon version - exact same as navbar home cube
function generateFaviconSVG() {
  // Uses exact same points as navbar home cube (viewBox 36x36)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  width="32" 
  height="32" 
  viewBox="0 0 36 36"
  xmlns="http://www.w3.org/2000/svg"
>
  <!-- Top face - Ethereum blue -->
  <polygon points="20,6 34,14 20,22 6,14" fill="${CONFIG.topColor}"/>
  <!-- Left face - Hardhat yellow -->
  <polygon points="6,14 20,22 20,36 6,28" fill="${CONFIG.leftColor}"/>
  <!-- Right face - Dark green -->
  <polygon points="20,22 34,14 34,28 20,36" fill="${CONFIG.rightColor}"/>
</svg>`;

  return svg;
}

// Main
function main() {
  console.log('Generating OpenScan cube logo...');
  
  // Generate main logo
  const svg = generateCubeSVG();
  const outputPath = path.join(__dirname, '..', 'public', 'openscan-cube-logo.svg');
  fs.writeFileSync(outputPath, svg);
  console.log(`Cube logo saved to: ${outputPath}`);
  
  // Also save to src/assets
  const assetsPath = path.join(__dirname, '..', 'src', 'assets', 'openscan-cube-logo.svg');
  fs.writeFileSync(assetsPath, svg);
  console.log(`Cube logo also saved to: ${assetsPath}`);

  // Generate favicon version
  const faviconSVG = generateFaviconSVG();
  const faviconPath = path.join(__dirname, '..', 'public', 'openscan-cube-favicon.svg');
  fs.writeFileSync(faviconPath, faviconSVG);
  console.log(`Favicon saved to: ${faviconPath}`);

  console.log('\nColors used:');
  console.log(`  Top face (Ethereum):  ${CONFIG.topColor}`);
  console.log(`  Left face (Hardhat):  ${CONFIG.leftColor}`);
  console.log(`  Right face (Dark):    ${CONFIG.rightColor}`);
}

main();
