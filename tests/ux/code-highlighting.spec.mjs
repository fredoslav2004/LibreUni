import { expect, test } from '@playwright/test';

function channel(value) {
  const number = Number(value) / 255;
  return number <= 0.03928 ? number / 12.92 : ((number + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(foreground, background) {
  const parse = (value) => value.match(/rgba?\(([^)]+)\)/)[1].split(',').map(Number);
  const luminance = (value) => {
    const [red, green, blue] = parse(value).map(channel);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const light = luminance(foreground);
  const dark = luminance(background);
  return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
}

test('monochrome dark code exercise tokens remain readable', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'monochrome');
    localStorage.setItem('color-mode', 'dark');
  });
  await page.goto('/lessons/algorithms/algorithm-engineering.html', { waitUntil: 'networkidle' });

  const result = await page.locator('.code-exercise-codeframe').evaluate((frame) => {
    const background = getComputedStyle(frame).backgroundColor;
    return [...frame.querySelectorAll('[class^="hl-"]')].map((token) => ({
      className: token.className,
      text: token.textContent,
      color: getComputedStyle(token).color,
      background,
      decoration: getComputedStyle(token).textDecorationLine,
    }));
  });

  expect(result.length).toBeGreaterThan(0);
  for (const token of result) {
    expect(
      contrastRatio(token.color, token.background),
      `${token.className} (${token.text}) has insufficient contrast`,
    ).toBeGreaterThanOrEqual(4.5);
  }

  const decoratedTokens = result.filter((item) => ['hl-keyword', 'hl-type', 'hl-directive'].includes(item.className));
  expect(result.some((item) => item.className === 'hl-keyword')).toBeTruthy();
  expect(decoratedTokens.length).toBeGreaterThan(0);
  for (const token of decoratedTokens) {
    expect(token.decoration, `${token.className} (${token.text}) should be underlined`).toContain('underline');
  }
});
