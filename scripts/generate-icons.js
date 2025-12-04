/**
 * Generate placeholder icons for the extension
 * Run with: node scripts/generate-icons.js
 *
 * This creates simple colored SVG icons that can be used as placeholders.
 * For production, replace these with properly designed icons.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG for each size
sizes.forEach((size) => {
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size / 8}" fill="#3B82F6"/>
  <path d="M ${size * 0.25} ${size * 0.35} L ${size * 0.75} ${size * 0.35} L ${size * 0.75} ${size * 0.65} L ${size * 0.25} ${size * 0.65} Z" fill="white" opacity="0.9"/>
  <rect x="${size * 0.3}" y="${size * 0.4}" width="${size * 0.15}" height="${size * 0.15}" rx="${size * 0.02}" fill="#3B82F6"/>
</svg>`.trim();

  const filename = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✓ Generated ${filename}`);
});

console.log('\nPlaceholder icons generated successfully!');
console.log('\nNote: These are SVG files. For Chrome extensions, you may need PNG files.');
console.log('You can convert these SVGs to PNGs using an online tool like:');
console.log('- https://cloudconvert.com/svg-to-png');
console.log('- Or use a design tool like Figma/Sketch');
console.log('\nAlternatively, use these SVGs as a template to design proper icons.');
