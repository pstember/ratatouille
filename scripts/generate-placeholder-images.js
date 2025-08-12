#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate SVG placeholder
function generateSVGPlaceholder(text, width = 400, height = 300) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle" dy=".3em">${text}</text>
  </svg>`;
}

// Generate placeholder images for test data
const testImages = [
  { filename: 'chicken-pasta.jpg', text: 'Chicken Pasta' },
  { filename: 'beef-stir-fry.jpg', text: 'Beef Stir Fry' },
  { filename: 'salad.jpg', text: 'Vegetarian Salad' },
  { filename: 'margherita-pizza.jpg', text: 'Margherita Pizza' },
  { filename: 'chicken-salad.jpg', text: 'Chicken Salad' },
  { filename: 'chocolate-cookies.jpg', text: 'Chocolate Cookies' }
];

const imagesDir = path.join(__dirname, '..', 'public', 'images');

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

console.log('🎨 Generating placeholder images...');

testImages.forEach(({ filename, text }) => {
  const svg = generateSVGPlaceholder(text);
  
  // Save as SVG file (can be served as image)
  const svgPath = path.join(imagesDir, filename.replace('.jpg', '.svg'));
  fs.writeFileSync(svgPath, svg);
  
  console.log(`✅ Generated placeholder for ${filename} -> ${filename.replace('.jpg', '.svg')}`);
});

console.log('🎉 All placeholder images generated!');
console.log('📁 Location: public/images/');
console.log('💡 Note: These are SVG files that can be served as images by the server');
