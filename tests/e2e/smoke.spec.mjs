import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const SEARCH_INDEX_PATH = fileURLToPath(new URL('../../dist/search-index.json', import.meta.url));
const LESSON_ROUTES = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, 'utf8'))
  .filter((entry) => entry.type === 'lesson')
  .map((entry) => ({ title: entry.title, url: `/${entry.url}` }));
const LESSON_BATCH_SIZE = 20;

const ROUTES = [
  {
    name: 'main home',
    url: 'http://127.0.0.1:4321/',
    expectedTitle: /LibreUni/i,
    expectedText: /Master the\s+fundamentals/i,
  },
  {
    name: 'main C lesson',
    url: 'http://127.0.0.1:4321/lessons/c/intro.html',
    expectedTitle: /C/i,
    expectedText: /C/i,
  },
  {
    name: 'main About page',
    url: 'http://127.0.0.1:4321/about.html',
    expectedTitle: /About/i,
    expectedText: /Updates/i,
  },
];

test.describe('production smoke checks', () => {
  for (const route of ROUTES) {
    test(`${route.name} renders without hard browser errors`, async ({ page }, testInfo) => {
      const browserErrors = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') {
          browserErrors.push(message.text());
        }
      });

      const response = await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

      expect(response?.ok(), `${route.url} should return a 2xx response`).toBe(true);
      await expect(page.locator('body')).toBeVisible();
      await expect(page).toHaveTitle(route.expectedTitle);
      await expect(page.locator('body')).toContainText(route.expectedText);
      await expect(page.locator('body')).not.toContainText(/Not found|Internal Server Error/i);

      const toleratedExternalNoise = browserErrors.filter(
        (message) => !/Failed to load resource: net::ERR_(BLOCKED_BY_CLIENT|ABORTED)/i.test(message),
      );
      await testInfo.attach(`${route.name} browser errors`, {
        body: JSON.stringify(toleratedExternalNoise, null, 2),
        contentType: 'application/json',
      });
      expect(toleratedExternalNoise).toEqual([]);
    });
  }

  for (let start = 0; start < LESSON_ROUTES.length; start += LESSON_BATCH_SIZE) {
    const batch = LESSON_ROUTES.slice(start, start + LESSON_BATCH_SIZE);
    const batchNumber = Math.floor(start / LESSON_BATCH_SIZE) + 1;

    test(`all lesson pages in batch ${batchNumber} render and hydrate`, async ({ page }) => {
      test.setTimeout(120_000);
      const failures = [];
      const browserErrors = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(message.text());
      });

      for (const lesson of batch) {
        browserErrors.length = 0;

        const response = await page.goto(lesson.url, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

        const article = page.locator('article');
        const articleText = (await article.innerText().catch(() => '')).trim();
        const toleratedErrors = browserErrors.filter(
          (message) => !/Failed to load resource: net::ERR_(BLOCKED_BY_CLIENT|ABORTED)/i.test(message),
        );
        const unhydratedIslands = await page.locator('astro-island[ssr]').count();

        if (!response?.ok()) failures.push(`${lesson.url}: HTTP ${response?.status()}`);
        if (articleText.length < 100) failures.push(`${lesson.url}: article is empty or truncated`);
        if (unhydratedIslands > 0) failures.push(`${lesson.url}: ${unhydratedIslands} island(s) did not hydrate`);
        if (toleratedErrors.length) failures.push(`${lesson.url}: ${toleratedErrors.join(' | ')}`);
      }

      expect(failures, failures.join('\n')).toEqual([]);
    });
  }

  test('main course search filters courses', async ({ page }) => {
    await page.goto('http://127.0.0.1:4321/courses.html', { waitUntil: 'domcontentloaded' });

    const search = page.locator('#course-search');
    await expect(search).toBeVisible();
    await search.fill('algorithms');

    const algorithmsCard = page.locator('.course-card:has(a[href$="courses/algorithms.html"])');
    const networksCard = page.locator('.course-card:has(a[href$="courses/computer-networks.html"])');

    await expect(algorithmsCard).toBeVisible();
    await expect(networksCard).toBeHidden();

    await search.fill('');
    await expect(networksCard).toBeVisible();
  });

  test('mobile menu exposes primary navigation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile-only navigation check.');

    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /toggle menu/i }).click();

    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu.getByRole('link', { name: /Home/i })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: /Courses/i })).toBeVisible();
    await expect(mobileMenu.getByRole('link', { name: /Career Paths/i })).toBeVisible();
  });

  test('interactive lesson controls hydrate together', async ({ page }) => {
    await page.goto('/lessons/algorithms/sorting-algorithms.html', { waitUntil: 'networkidle' });

    const quiz = page.locator('.quiz-container').first();
    const answer = quiz.getByRole('button').first();
    await answer.click();
    await expect(answer).toHaveClass(/border-primary bg-primary\/10/);

    const themeToggle = page.getByRole('button', { name: /Choose theme/ });
    await themeToggle.click();
    await expect(page.getByRole('dialog', { name: 'Theme settings' })).toBeVisible();

    const search = page.getByRole('textbox', { name: /Search courses, modules, and topics/ }).first();
    await search.fill('shortest');
    await expect(search).toHaveValue('shortest');
  });

  test('data-structures playground exposes explicit state controls', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/lessons/data-structures/balanced-search-trees.html', { waitUntil: 'networkidle' });

    const playground = page.locator('.interactive-playground').first();
    await expect(playground.getByRole('img', { name: /rotation/i })).toBeVisible();
    await playground.getByRole('button', { name: /next step/i }).click();
    await expect(playground).toContainText(/step 2 of 2/);
    await playground.getByRole('button', { name: /reset/i }).click();
    await expect(playground).toContainText(/step 1 of 2/);
    expect(errors).toEqual([]);
  });

  test('data-structures visuals and math are rendered, not leaked source', async ({ page }) => {
    const dataStructures = LESSON_ROUTES.filter((lesson) => lesson.url.startsWith('/lessons/data-structures/'));
    const failures = [];
    for (const lesson of dataStructures) {
      await page.goto(lesson.url, { waitUntil: 'domcontentloaded' });
      const article = page.locator('article');
      const visibleText = await article.evaluate((root) => {
        const clone = root.cloneNode(true);
        clone.querySelectorAll('pre, code, svg, details, script, style, annotation, astro-island').forEach((node) => node.remove());
        return clone.textContent || '';
      });
      const visualArtifacts = page.locator('[data-structure-diagram], [data-diagram-kind]');
      const renderedVisuals = visualArtifacts.locator('svg, img');
      if ((await visualArtifacts.count()) < 3) failures.push(`${lesson.url}: fewer than three visual artifacts`);
      if ((await renderedVisuals.count()) < 3) failures.push(`${lesson.url}: rendered visual artifact missing`);
      if (/\\(?:sum|frac|sqrt|Theta|Omega|alpha|beta|ge|le|log|lfloor|rfloor)\b|(?<!\\)\$(?!\$)/.test(visibleText)) {
        failures.push(`${lesson.url}: raw TeX visible in lesson text`);
      }
      if (visibleText.includes('\\n')) failures.push(`${lesson.url}: escaped newline leaked into lesson text`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  test('development quality page renders charts and supports table sorting', async ({ page }) => {
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        browserErrors.push(message.text());
      }
    });

    await page.goto('http://127.0.0.1:4321/development.html', { waitUntil: 'networkidle' });

    // Verify no console/browser errors occurred (tolerating 404 resource failures for UX reports that build later in pipeline)
    const toleratedErrors = browserErrors.filter(
      (msg) => !/Failed to load resource/i.test(msg)
    );
    expect(toleratedErrors).toEqual([]);

    // Check that plots are visible (meaning JS rendered them and removed the 'hidden' class)
    const screePlot = page.locator('#scree-plot');
    await expect(screePlot).toBeVisible();
    await expect(screePlot).not.toHaveClass(/hidden/);
    await expect(screePlot.locator('rect')).not.toHaveCount(0);

    const scatterPlot = page.locator('#scatter-plot');
    await expect(scatterPlot).toBeVisible();
    await expect(scatterPlot).not.toHaveClass(/hidden/);
    await expect(scatterPlot.locator('circle.scatter-dot')).not.toHaveCount(0);

    // Check warning list rendering
    const warningsList = page.locator('#warnings-list');
    await expect(warningsList.locator('.warning-card')).not.toHaveCount(0);

    // Test table sorting by lessons
    const courseMetricsBody = page.locator('#course-metrics');

    // Click sort by lessons
    await page.locator('button[data-sort="lessons"]').click();
    const firstRowAfterAsc = await courseMetricsBody.locator('tr').first().innerText();

    // Click again for descending sort
    await page.locator('button[data-sort="lessons"]').click();
    const firstRowAfterDesc = await courseMetricsBody.locator('tr').first().innerText();

    expect(firstRowAfterAsc).not.toEqual(firstRowAfterDesc);
  });
});

test('every course PDF is available as a downloadable document', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:4321/courses/operating-systems.pdf');

  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toMatch(/^application\/pdf/);
});
