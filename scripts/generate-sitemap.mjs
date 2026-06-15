import fs from 'fs';
import path from 'path';

// This generator emits a minimal sitemap.xml. For a more complete sitemap,
// extend this to enumerate dynamic pages (jobs, companies) from your data source.
async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const urls = ['/', '/jobs', '/companies'];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    )
    .join('\n')}\n</urlset>`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log('Wrote sitemap.xml');
}

generate();
