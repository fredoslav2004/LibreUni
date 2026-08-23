import { test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'reports/visual');

const captures = [
  { name: 'home-monochrome-dark', url: '/', theme: 'monochrome', mode: 'dark', viewport: { width: 1440, height: 1000 } },
  { name: 'catalog-monochrome-desktop', url: '/courses.html', theme: 'monochrome', mode: 'light', viewport: { width: 1440, height: 1000 } },
  { name: 'course-overview-monochrome-dark', url: '/courses/software-engineering.html', theme: 'monochrome', mode: 'dark', viewport: { width: 1440, height: 1000 } },
  { name: 'career-path-monochrome-light', url: '/careers/computer-science-core.html', theme: 'monochrome', mode: 'light', viewport: { width: 1440, height: 1000 } },
  { name: 'career-path-monochrome-dark-mobile', url: '/careers/computer-science-core.html', theme: 'monochrome', mode: 'dark', viewport: { width: 390, height: 844 } },
  { name: 'development-monochrome-light', url: '/development.html', theme: 'monochrome', mode: 'light', viewport: { width: 1440, height: 1000 } },
  { name: 'about-monochrome-light', url: '/about.html', theme: 'monochrome', mode: 'light', viewport: { width: 1440, height: 1000 } },
  { name: 'about-monochrome-light-mobile', url: '/about.html', theme: 'monochrome', mode: 'light', viewport: { width: 390, height: 844 } },
  { name: 'lesson-monochrome-light-mobile', url: '/lessons/c/intro.html', theme: 'monochrome', mode: 'light', viewport: { width: 390, height: 844 } },
  { name: 'theme-menu-monochrome-dark', url: '/', theme: 'monochrome', mode: 'dark', viewport: { width: 1440, height: 1000 }, openThemeMenu: true },
  { name: 'catalog-modern-mobile', url: '/courses.html', theme: 'modern', mode: 'light', viewport: { width: 390, height: 844 } },
  { name: 'catalog-scholar-dark', url: '/courses.html', theme: 'scholar', mode: 'dark', viewport: { width: 1440, height: 1000 } },
  { name: 'course-overview-scholar-dark', url: '/courses/software-engineering.html', theme: 'scholar', mode: 'dark', viewport: { width: 1440, height: 1000 } },
  { name: 'course-overview-modern-mobile', url: '/courses/software-engineering.html', theme: 'modern', mode: 'light', viewport: { width: 390, height: 844 } },
  { name: 'lesson-monochrome-dark', url: '/lessons/c/intro.html', theme: 'monochrome', mode: 'dark', viewport: { width: 1440, height: 1000 } },
  { name: 'lesson-modern-mobile', url: '/lessons/c/intro.html', theme: 'modern', mode: 'dark', viewport: { width: 390, height: 844 } },
];

test('capture representative visual states', async ({ context }) => {
  await fs.mkdir(outputDir, { recursive: true });

  for (const capture of captures) {
    const page = await context.newPage();
    await page.setViewportSize(capture.viewport);
    await page.addInitScript(({ theme, mode }) => {
      localStorage.setItem('theme', theme);
      localStorage.setItem('color-mode', mode);
    }, { theme: capture.theme, mode: capture.mode });
    await page.goto(`http://127.0.0.1:4321${capture.url}`, { waitUntil: 'networkidle' });
    if (capture.openThemeMenu) await page.getByRole('button', { name: /choose theme and appearance/i }).click();
    await page.screenshot({ path: path.join(outputDir, `${capture.name}.png`), fullPage: true });
    await page.close();
  }
});
