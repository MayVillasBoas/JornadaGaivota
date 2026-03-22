/**
 * Generate thumbnails for lab visualizations using Playwright.
 * Run: npx tsx scripts/generate-thumbnails.ts
 * Requires the dev server to be running on port 4321.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = join(import.meta.dirname, '..', 'public', 'lab', 'thumbnails');

const PAGES = [
  {
    url: 'http://localhost:4321/fractais',
    selector: '.fractal-section',
    vizAttr: 'data-viz',
  },
  {
    url: 'http://localhost:4321/complexity',
    selector: '.complexity-section',
    vizAttr: 'data-viz',
  },
  {
    url: 'http://localhost:4321/patterns',
    selector: '.lab-section',
    vizAttr: 'data-viz',
  },
];

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  for (const pageConfig of PAGES) {
    console.log(`\nNavigating to ${pageConfig.url}...`);
    const page = await context.newPage();
    await page.goto(pageConfig.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const sections = await page.$$(pageConfig.selector);
    console.log(`Found ${sections.length} visualization sections`);

    for (const section of sections) {
      const slug = await section.getAttribute(pageConfig.vizAttr);
      if (!slug) continue;

      // Use JS to scroll the section into the scroll-snap container viewport
      await page.evaluate((el) => {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, section);

      // Give the canvas time to render after scrolling
      await page.waitForTimeout(3000);

      // Take a screenshot of the section (not just the canvas) to capture the full visualization
      const outputPath = join(OUTPUT_DIR, `${slug}.webp`);
      const pngPath = join(OUTPUT_DIR, `${slug}.png`);

      try {
        // Try screenshotting the canvas first
        const canvas = await section.$('canvas');
        if (canvas) {
          const box = await canvas.boundingBox();
          if (box && box.width > 0 && box.height > 0) {
            await canvas.screenshot({ path: pngPath, type: 'png' });
            console.log(`  Captured ${slug} -> ${pngPath}`);
            continue;
          }
        }
      } catch {
        // fallback to section screenshot
      }

      // Fallback: screenshot the whole section
      try {
        await section.screenshot({ path: pngPath, type: 'png', timeout: 5000 });
        console.log(`  Captured ${slug} (section fallback) -> ${pngPath}`);
      } catch (err) {
        console.log(`  Failed to capture ${slug}: ${(err as Error).message}`);
      }
    }

    await page.close();
  }

  await browser.close();
  console.log('\nDone! Thumbnails saved to public/lab/thumbnails/');
}

main().catch(console.error);
