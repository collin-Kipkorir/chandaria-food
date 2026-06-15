import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const svgPath = path.join(publicDir, 'favicon.svg');
  const outPath = path.join(publicDir, 'og-image.png');

  try {
    const svg = await readFile(svgPath);
    await sharp(svg)
      .resize(1200, 630, { fit: 'contain', background: { r: 248, g: 245, b: 239, alpha: 1 } })
      .png()
      .toFile(outPath);
    console.log('Generated', outPath);
  } catch (err) {
    console.error('Failed to generate OG image:', err);
    process.exit(1);
  }
}

generate();
