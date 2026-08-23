import { expect, test } from '@playwright/test';

test('lesson disclosures have consistent markers and vertical content flow', async ({ page }) => {
  await page.goto('/lessons/algorithms/algorithm-engineering.html', { waitUntil: 'networkidle' });

  const disclosures = page.locator('#lesson-container article.prose details:not(.diagram-source)');
  await expect(disclosures).not.toHaveCount(0);

  const result = await disclosures.evaluateAll((elements) => elements.map((details) => {
    details.open = true;
    const summary = details.querySelector(':scope > summary');
    const content = [...details.children].find((child) => child !== summary);
    const summaryStyle = getComputedStyle(summary);
    const markerStyle = getComputedStyle(summary, '::before');
    const summaryBox = summary.getBoundingClientRect();
    const contentBox = content?.getBoundingClientRect();

    return {
      display: summaryStyle.display,
      listStyle: summaryStyle.listStyleType,
      markerContent: markerStyle.content,
      markerWidth: markerStyle.width,
      contentBelowSummary: !contentBox || contentBox.top >= summaryBox.bottom,
      orderedItemCount: details.querySelectorAll(':scope > div ol > li').length,
    };
  }));

  for (const disclosure of result) {
    expect(disclosure.display).toBe('flex');
    expect(disclosure.listStyle).toBe('none');
    expect(disclosure.markerContent).not.toBe('none');
    expect(disclosure.markerWidth).not.toBe('0px');
    expect(disclosure.contentBelowSummary).toBe(true);
  }
});
