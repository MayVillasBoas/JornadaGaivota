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
    infoSelector: '.fractal-info',
  },
  {
    url: 'http://localhost:4321/complexity',
    selector: '.complexity-section',
    vizAttr: 'data-viz',
    infoSelector: '.complexity-info',
  },
  {
    url: 'http://localhost:4321/patterns',
    selector: '.lab-section',
    vizAttr: 'data-viz',
    infoSelector: '.lab-info',
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

    // Hide ALL info overlays before taking any screenshots
    await page.evaluate((infoSel) => {
      document.querySelectorAll(infoSel).forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    }, pageConfig.infoSelector);

    const sections = await page.$$(pageConfig.selector);
    console.log(`Found ${sections.length} visualization sections`);

    for (const section of sections) {
      const slug = await section.getAttribute(pageConfig.vizAttr);
      if (!slug) continue;

      // Scroll into view
      await page.evaluate((el) => {
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, section);

      await page.waitForTimeout(3000);

      const pngPath = join(OUTPUT_DIR, `${slug}.png`);

      try {
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
        // fallback
      }

      // Fallback: screenshot the section (now without info overlay)
      try {
        await section.screenshot({ path: pngPath, type: 'png', timeout: 5000 });
        console.log(`  Captured ${slug} (section) -> ${pngPath}`);
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
