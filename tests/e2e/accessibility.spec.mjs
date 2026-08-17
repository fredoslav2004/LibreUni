import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const A11Y_ROUTES = [
  { name: 'main home', url: 'http://127.0.0.1:4321/' },
  { name: 'main Python lesson', url: 'http://127.0.0.1:4321/lessons/python/intro.html' },
  { name: 'main About page', url: 'http://127.0.0.1:4321/about.html' },
];

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

function formatViolations(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.slice(0, 5).map((node) => ({
      target: node.target,
      summary: node.failureSummary,
    })),
  }));
}

test.describe('automated accessibility checks', () => {
  for (const route of A11Y_ROUTES) {
    test(`${route.name} has no serious axe violations`, async ({ page }, testInfo) => {
      await page.goto(route.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

      const scan = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      const blockingViolations = scan.violations.filter((violation) => BLOCKING_IMPACTS.has(violation.impact));

      await testInfo.attach(`${route.name} axe results`, {
        body: JSON.stringify(formatViolations(scan.violations), null, 2),
        contentType: 'application/json',
      });

      expect(formatViolations(blockingViolations)).toEqual([]);
    });
  }
});
