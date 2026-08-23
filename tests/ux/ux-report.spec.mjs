import { expect, test } from '@playwright/test';
import { achromatopsia, deuteranopia, protanopia, tritanopia } from '@cantoo/color-blindness';
import Color from 'colorjs.io';
import fs from 'node:fs/promises';
import path from 'node:path';

const REPORT_DIR = path.resolve(process.cwd(), 'reports/ux');

const TARGETS = [
  { app: 'main', name: 'Home (Modern Light)', url: 'http://127.0.0.1:4321/', theme: 'modern', mode: 'light' },
  { app: 'main', name: 'C Lesson (Monochrome Light)', url: 'http://127.0.0.1:4321/lessons/c/intro.html', theme: 'monochrome', mode: 'light' },
  { app: 'main', name: 'C Lesson (Monochrome Dark)', url: 'http://127.0.0.1:4321/lessons/c/intro.html', theme: 'monochrome', mode: 'dark' },
  { app: 'main', name: 'Career Path (Monochrome Light)', url: 'http://127.0.0.1:4321/careers/computer-science-core.html', theme: 'monochrome', mode: 'light' },
  { app: 'main', name: 'Career Path (Monochrome Dark)', url: 'http://127.0.0.1:4321/careers/computer-science-core.html', theme: 'monochrome', mode: 'dark' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000, minGap: 6, minTarget: 24, recommendedTarget: 44 },
  { name: 'mobile', width: 390, height: 844, minGap: 8, minTarget: 24, recommendedTarget: 44 },
];

const CVD_SIMULATORS = {
  protanopia,
  deuteranopia,
  tritanopia,
  achromatopsia,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseRgb(input) {
  const match = String(input).match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const [r, g, b, alpha = '1'] = match[1]
    .split(',')
    .map((part) => part.trim())
    .map(Number);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
    alpha: Number.isNaN(alpha) ? 1 : alpha,
  };
}

function toHex({ r, g, b }) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function contrastRatio(foreground, background) {
  return new Color(background).contrast(new Color(foreground), 'WCAG21');
}

function apcaContrast(foreground, background) {
  return Math.abs(new Color(background).contrast(new Color(foreground), 'APCA'));
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values, fallback = 100) {
  if (!values.length) {
    return fallback;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function analyzeColorPairs(pairs) {
  const uniquePairs = new Map();

  for (const pair of pairs) {
    const foreground = parseRgb(pair.color);
    const background = parseRgb(pair.backgroundColor);

    if (!foreground || !background || foreground.alpha < 0.1 || background.alpha < 0.1) {
      continue;
    }

    const foregroundHex = toHex(foreground);
    const backgroundHex = toHex(background);
    const key = `${foregroundHex}|${backgroundHex}|${pair.fontSize}|${pair.fontWeight}`;

    if (!uniquePairs.has(key)) {
      uniquePairs.set(key, {
        ...pair,
        foreground: foregroundHex,
        background: backgroundHex,
      });
    }
  }

  const findings = [];
  const samples = [];

  for (const pair of uniquePairs.values()) {
    const fontSize = Number.parseFloat(pair.fontSize);
    const fontWeight = Number.parseInt(pair.fontWeight, 10);
    const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const wcagTarget = isLargeText ? 3 : 4.5;
    const apcaTarget = isLargeText ? 45 : 60;
    const wcag = contrastRatio(pair.foreground, pair.background);
    const apca = apcaContrast(pair.foreground, pair.background);
    const simulated = Object.fromEntries(
      Object.entries(CVD_SIMULATORS).map(([name, simulate]) => {
        const foreground = simulate(pair.foreground);
        const background = simulate(pair.background);
        return [
          name,
          {
            foreground,
            background,
            wcag: contrastRatio(foreground, background),
          },
        ];
      }),
    );
    const worstSimulation = Object.entries(simulated)
      .sort(([, a], [, b]) => a.wcag - b.wcag)
      .at(0);

    const sample = {
      selector: pair.selector,
      text: pair.text,
      foreground: pair.foreground,
      background: pair.background,
      fontSize: pair.fontSize,
      fontWeight: pair.fontWeight,
      wcag: Number(wcag.toFixed(2)),
      wcagTarget,
      apca: Number(apca.toFixed(1)),
      apcaTarget,
      worstSimulation: worstSimulation
        ? {
            name: worstSimulation[0],
            wcag: Number(worstSimulation[1].wcag.toFixed(2)),
            foreground: worstSimulation[1].foreground,
            background: worstSimulation[1].background,
          }
        : null,
    };

    samples.push(sample);

    if (wcag < wcagTarget) {
      findings.push({
        severity: 'critical',
        type: 'contrast',
        message: `WCAG contrast ${wcag.toFixed(2)} is below ${wcagTarget}:1`,
        selector: pair.selector,
        sample,
      });
    } else if (apca < apcaTarget) {
      findings.push({
        severity: 'warning',
        type: 'apca-contrast',
        message: `APCA contrast ${apca.toFixed(1)} is below the modern readability target ${apcaTarget}`,
        selector: pair.selector,
        sample,
      });
    }

    if (worstSimulation && worstSimulation[1].wcag < wcagTarget) {
      findings.push({
        severity: 'warning',
        type: 'color-blind-contrast',
        message: `${worstSimulation[0]} simulated contrast ${worstSimulation[1].wcag.toFixed(2)} is below ${wcagTarget}:1`,
        selector: pair.selector,
        sample,
      });
    }
  }

  return {
    findings,
    samples: samples.sort((a, b) => a.wcag - b.wcag).slice(0, 40),
  };
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function calculateScores({ colors, dom }) {
  const findings = [...dom.findings, ...colors.findings];
  const criticalCount = findings.filter((finding) => finding.severity === 'critical').length;
  const warningCount = findings.filter((finding) => finding.severity === 'warning').length;
  const interactiveCount = Math.max(dom.interactive.length, 1);

  const wcagContrast = average(colors.samples.map((sample) => clamp((sample.wcag / sample.wcagTarget) * 100)));
  const apcaReadability = average(colors.samples.map((sample) => clamp((sample.apca / sample.apcaTarget) * 100)));
  const colorBlindContrast = average(
    colors.samples.map((sample) => {
      if (!sample.worstSimulation) {
        return 100;
      }

      return clamp((sample.worstSimulation.wcag / sample.wcagTarget) * 100);
    }),
  );

  const targetPenalties = dom.findings
    .filter((finding) => finding.type === 'target-size')
    .reduce((sum, finding) => sum + (finding.severity === 'critical' ? 18 : 7), 0);
  const spacingPenalties = dom.findings
    .filter((finding) => ['interactive-gap', 'interactive-overlap'].includes(finding.type))
    .reduce((sum, finding) => sum + (finding.severity === 'critical' ? 20 : 6), 0);
  const overflowPenalties = dom.findings
    .filter((finding) => finding.type === 'horizontal-overflow')
    .reduce((sum, finding) => sum + (finding.severity === 'critical' ? 30 : 10), 0);
  const structurePenalties = dom.findings
    .filter((finding) => finding.type === 'heading-landmark')
    .reduce((sum) => sum + 4, 0);

  const targetSize = clamp(100 - (targetPenalties / interactiveCount) * 8);
  const layout = clamp(100 - spacingPenalties - overflowPenalties - structurePenalties);
  const accessibility = clamp((wcagContrast * 0.55) + (targetSize * 0.2) + (layout * 0.15) + (apcaReadability * 0.1));
  const userFriendly = clamp((layout * 0.35) + (targetSize * 0.3) + (apcaReadability * 0.2) + (colorBlindContrast * 0.15));
  const overall = clamp(
    (accessibility * 0.3) +
      (userFriendly * 0.3) +
      (colorBlindContrast * 0.25) +
      (layout * 0.15) -
      (criticalCount * 8) -
      (warningCount * 1.5),
  );

  return {
    accessibility: Math.round(accessibility),
    apcaReadability: Math.round(apcaReadability),
    colorBlindFriendly: Math.round(colorBlindContrast),
    layoutStability: Math.round(layout),
    overall: Math.round(overall),
    targetSize: Math.round(targetSize),
    userFriendly: Math.round(userFriendly),
    wcagContrast: Math.round(wcagContrast),
  };
}

function scoreClass(score) {
  if (score >= 90) return 'great';
  if (score >= 75) return 'good';
  if (score >= 60) return 'ok';
  return 'poor';
}

function renderScore(label, value) {
  return `
    <div class="score-tile ${scoreClass(value)}">
      <div class="score-label">${escapeHtml(label)}</div>
      <div class="score-value">${value}%</div>
      <div class="score-bar"><span style="width:${value}%"></span></div>
    </div>
  `;
}

function renderReport(results) {
  const totals = results.reduce(
    (acc, result) => {
      acc.critical += result.summary.critical;
      acc.warning += result.summary.warning;
      return acc;
    },
    { critical: 0, warning: 0 },
  );
  const aggregateScores = {
    accessibility: Math.round(average(results.map((result) => result.scores.accessibility))),
    colorBlindFriendly: Math.round(average(results.map((result) => result.scores.colorBlindFriendly))),
    layoutStability: Math.round(average(results.map((result) => result.scores.layoutStability))),
    overall: Math.round(average(results.map((result) => result.scores.overall))),
    targetSize: Math.round(average(results.map((result) => result.scores.targetSize))),
    userFriendly: Math.round(average(results.map((result) => result.scores.userFriendly))),
  };

  const cards = results
    .map((result) => {
      const findings = [...result.dom.findings, ...result.colors.findings];
      const findingRows = findings.length
        ? findings
            .slice(0, 24)
            .map(
              (finding) => `
                <tr>
                  <td><span class="badge ${finding.severity}">${escapeHtml(finding.severity)}</span></td>
                  <td>${escapeHtml(finding.type)}</td>
                  <td>${escapeHtml(finding.message)}</td>
                  <td><code>${escapeHtml(finding.selector ?? '')}</code></td>
                </tr>
              `,
            )
            .join('')
        : '<tr><td colspan="4">No findings.</td></tr>';

      const colorRows = result.colors.samples
        .slice(0, 10)
        .map(
          (sample) => `
            <tr>
              <td><code>${escapeHtml(sample.selector)}</code></td>
              <td>
                <span class="swatch" style="background:${sample.foreground}"></span>
                ${escapeHtml(sample.foreground)}
              </td>
              <td>
                <span class="swatch" style="background:${sample.background}"></span>
                ${escapeHtml(sample.background)}
              </td>
              <td>${sample.wcag} / ${sample.wcagTarget}</td>
              <td>${sample.apca} / ${sample.apcaTarget}</td>
              <td>${escapeHtml(sample.worstSimulation?.name ?? 'n/a')} ${sample.worstSimulation?.wcag ?? ''}</td>
            </tr>
          `,
        )
        .join('');

      return `
        <section class="card">
          <div class="card-heading">
            <div>
              <p>${escapeHtml(result.target.app)} / ${escapeHtml(result.viewport.name)}</p>
              <h2>${escapeHtml(result.target.name)}</h2>
              <a href="${escapeHtml(result.target.url)}">${escapeHtml(result.target.url)}</a>
            </div>
            <div class="score ${result.summary.critical ? 'fail' : 'pass'}">
              ${result.summary.critical} critical<br />
              <span>${result.summary.warning} warnings</span>
            </div>
          </div>
          <div class="metrics">
            <span>Viewport ${result.viewport.width}x${result.viewport.height}</span>
            <span>Scroll ${result.dom.metrics.scrollWidth}x${result.dom.metrics.scrollHeight}</span>
            <span>${result.dom.interactive.length} interactive elements sampled</span>
          </div>
          <div class="score-grid compact">
            ${renderScore('Overall', result.scores.overall)}
            ${renderScore('Color-Blind Friendly', result.scores.colorBlindFriendly)}
            ${renderScore('User Friendly', result.scores.userFriendly)}
            ${renderScore('Layout', result.scores.layoutStability)}
            ${renderScore('Tap/Click Targets', result.scores.targetSize)}
            ${renderScore('WCAG Contrast', result.scores.wcagContrast)}
          </div>
          <img src="${escapeHtml(result.screenshot)}" alt="${escapeHtml(result.target.name)} ${escapeHtml(result.viewport.name)} screenshot" />
          <h3>Findings</h3>
          <table>
            <thead><tr><th>Severity</th><th>Type</th><th>Message</th><th>Selector</th></tr></thead>
            <tbody>${findingRows}</tbody>
          </table>
          <h3>Lowest Contrast Samples</h3>
          <table>
            <thead><tr><th>Selector</th><th>Text</th><th>Background</th><th>WCAG</th><th>APCA</th><th>Worst CVD</th></tr></thead>
            <tbody>${colorRows || '<tr><td colspan="6">No text samples.</td></tr>'}</tbody>
          </table>
        </section>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LibreUni UX Report</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }
      body {
        background: #f8fafc;
        color: #0f172a;
        margin: 0;
      }
      header {
        background: #0f172a;
        color: white;
        padding: 32px;
      }
      header p {
        color: #cbd5e1;
        margin: 8px 0 0;
      }
      main {
        display: grid;
        gap: 24px;
        margin: 0 auto;
        max-width: 1180px;
        padding: 24px;
      }
      .card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 24px;
      }
      .card-heading {
        align-items: start;
        display: flex;
        gap: 24px;
        justify-content: space-between;
      }
      .card-heading p {
        color: #64748b;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        margin: 0 0 4px;
        text-transform: uppercase;
      }
      h1, h2, h3 {
        letter-spacing: 0;
        margin: 0;
      }
      h3 {
        font-size: 16px;
        margin-top: 24px;
      }
      a {
        color: #2563eb;
      }
      img {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        display: block;
        margin-top: 18px;
        max-height: 520px;
        max-width: 100%;
        object-fit: contain;
        object-position: top left;
      }
      table {
        border-collapse: collapse;
        font-size: 13px;
        margin-top: 10px;
        width: 100%;
      }
      th, td {
        border-top: 1px solid #e2e8f0;
        padding: 8px;
        text-align: left;
        vertical-align: top;
      }
      code {
        color: #334155;
        white-space: pre-wrap;
      }
      .metrics {
        color: #475569;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }
      .metrics span {
        background: #f1f5f9;
        border-radius: 999px;
        padding: 4px 10px;
      }
      .score {
        border-radius: 8px;
        flex: 0 0 auto;
        font-weight: 900;
        padding: 12px 14px;
        text-align: right;
      }
      .score span {
        font-size: 12px;
        font-weight: 700;
      }
      .score.pass {
        background: #ecfdf5;
        color: #047857;
      }
      .score.fail {
        background: #fef2f2;
        color: #b91c1c;
      }
      .score-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        margin-top: 20px;
      }
      .score-grid.compact {
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      }
      .score-tile {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
      }
      header .score-tile {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.18);
      }
      .score-label {
        color: #64748b;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      header .score-label {
        color: #cbd5e1;
      }
      .score-value {
        font-size: 26px;
        font-weight: 900;
        margin-top: 4px;
      }
      .score-bar {
        background: #e2e8f0;
        border-radius: 999px;
        height: 7px;
        margin-top: 8px;
        overflow: hidden;
      }
      header .score-bar {
        background: rgba(255, 255, 255, 0.18);
      }
      .score-bar span {
        display: block;
        height: 100%;
      }
      .score-tile.great .score-value { color: #047857; }
      .score-tile.good .score-value { color: #2563eb; }
      .score-tile.ok .score-value { color: #b45309; }
      .score-tile.poor .score-value { color: #b91c1c; }
      header .score-tile.great .score-value { color: #6ee7b7; }
      header .score-tile.good .score-value { color: #93c5fd; }
      header .score-tile.ok .score-value { color: #fcd34d; }
      header .score-tile.poor .score-value { color: #fca5a5; }
      .score-tile.great .score-bar span { background: #10b981; }
      .score-tile.good .score-bar span { background: #3b82f6; }
      .score-tile.ok .score-bar span { background: #f59e0b; }
      .score-tile.poor .score-bar span { background: #ef4444; }
      .badge {
        border-radius: 999px;
        color: white;
        display: inline-block;
        font-size: 11px;
        font-weight: 900;
        padding: 2px 8px;
        text-transform: uppercase;
      }
      .badge.critical {
        background: #dc2626;
      }
      .badge.warning {
        background: #b45309;
      }
      .swatch {
        border: 1px solid #cbd5e1;
        display: inline-block;
        height: 12px;
        margin-right: 6px;
        vertical-align: -2px;
        width: 12px;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>LibreUni UX Report</h1>
      <p>${totals.critical} critical findings and ${totals.warning} warnings across ${results.length} page/viewport checks.</p>
      <div class="score-grid">
        ${renderScore('Overall UX Health', aggregateScores.overall)}
        ${renderScore('Color-Blind Friendly', aggregateScores.colorBlindFriendly)}
        ${renderScore('User Friendly', aggregateScores.userFriendly)}
        ${renderScore('Accessibility', aggregateScores.accessibility)}
        ${renderScore('Layout Stability', aggregateScores.layoutStability)}
        ${renderScore('Tap/Click Targets', aggregateScores.targetSize)}
      </div>
    </header>
    <main>${cards}</main>
  </body>
</html>`;
}

test('generate UX health report', async ({ page }, testInfo) => {
  test.setTimeout(180_000);

  await fs.rm(REPORT_DIR, { recursive: true, force: true });
  await fs.mkdir(REPORT_DIR, { recursive: true });

  const results = [];

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const target of TARGETS) {
      await page.goto(target.url, { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ theme, mode }) => {
        localStorage.setItem('theme', theme);
        localStorage.setItem('color-mode', mode);
      }, target);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(300);

      const fileBase = `${slugify(target.app)}-${slugify(target.name)}-${viewport.name}`;
      const screenshotPath = path.join(REPORT_DIR, `${fileBase}.png`);
      await page.screenshot({ fullPage: true, path: screenshotPath });

      const dom = await page.evaluate((options) => {
        const INTERACTIVE_SELECTOR = [
          'a[href]',
          'button',
          'input',
          'select',
          'textarea',
          'summary',
          '[role="button"]',
          '[role="link"]',
          '[role="tab"]',
          '[role="menuitem"]',
          '[tabindex]:not([tabindex="-1"])',
        ].join(',');

        function isRendered(element) {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const hasDisabledPointerAncestor = Boolean(element.closest('.pointer-events-none,[aria-hidden="true"]'));
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.pointerEvents !== 'none' &&
            !hasDisabledPointerAncestor &&
            Number(style.opacity) > 0.01 &&
            rect.width > 0 &&
            rect.height > 0 &&
            element.getAttribute('aria-hidden') !== 'true'
          );
        }

        function isInViewport(rect) {
          return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
        }

        function labelFor(element) {
          const ariaLabel = element.getAttribute('aria-label');
          const title = element.getAttribute('title');
          const text = element.textContent?.replace(/\s+/g, ' ').trim();
          return (ariaLabel || title || text || element.tagName.toLowerCase()).slice(0, 90);
        }

        function selectorFor(element) {
          if (element.id) {
            return `#${CSS.escape(element.id)}`;
          }

          const parts = [];
          let current = element;
          while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body && parts.length < 4) {
            const tag = current.tagName.toLowerCase();
            const className = Array.from(current.classList).slice(0, 2).map((item) => `.${CSS.escape(item)}`).join('');
            const siblings = Array.from(current.parentElement?.children ?? []).filter((item) => item.tagName === current.tagName);
            const index = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : '';
            parts.unshift(`${tag}${className}${index}`);
            current = current.parentElement;
          }
          return parts.join(' > ') || element.tagName.toLowerCase();
        }

        function rectFor(element) {
          const rect = element.getBoundingClientRect();
          return {
            bottom: Number(rect.bottom.toFixed(1)),
            height: Number(rect.height.toFixed(1)),
            left: Number(rect.left.toFixed(1)),
            right: Number(rect.right.toFixed(1)),
            top: Number(rect.top.toFixed(1)),
            width: Number(rect.width.toFixed(1)),
          };
        }

        function distanceBetween(first, second) {
          const xGap = first.right < second.left ? second.left - first.right : second.right < first.left ? first.left - second.right : 0;
          const yGap = first.bottom < second.top ? second.top - first.bottom : second.bottom < first.top ? first.top - second.bottom : 0;
          const overlapX = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
          const overlapY = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
          return {
            distance: Number(Math.hypot(xGap, yGap).toFixed(1)),
            overlapArea: Number((overlapX * overlapY).toFixed(1)),
          };
        }

        const findings = [];
        const rendered = Array.from(document.body.querySelectorAll('*')).filter(isRendered);
        const interactive = Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR))
          .filter(isRendered)
          .map((element) => ({
            label: labelFor(element),
            selector: selectorFor(element),
            rect: rectFor(element),
          }))
          .filter((item) => isInViewport(item.rect));

        for (const item of interactive) {
          const minDimension = Math.min(item.rect.width, item.rect.height);
          if (minDimension < options.minTarget) {
            findings.push({
              severity: 'critical',
              type: 'target-size',
              message: `Interactive target is ${minDimension}px on its smallest side; minimum is ${options.minTarget}px`,
              selector: item.selector,
              rect: item.rect,
            });
          } else if (minDimension < options.recommendedTarget) {
            findings.push({
              severity: 'warning',
              type: 'target-size',
              message: `Interactive target is ${minDimension}px on its smallest side; recommended target is ${options.recommendedTarget}px`,
              selector: item.selector,
              rect: item.rect,
            });
          }
        }

        const closePairs = [];
        for (let index = 0; index < interactive.length; index += 1) {
          for (let otherIndex = index + 1; otherIndex < interactive.length; otherIndex += 1) {
            const first = interactive[index];
            const second = interactive[otherIndex];
            const firstElement = document.querySelector(first.selector);
            const secondElement = document.querySelector(second.selector);

            if (firstElement?.contains(secondElement) || secondElement?.contains(firstElement)) {
              continue;
            }

            const proximity = distanceBetween(first.rect, second.rect);
            if (proximity.overlapArea > 1) {
              closePairs.push({ first, second, ...proximity, severity: 'critical' });
            } else if (proximity.distance < options.minGap) {
              closePairs.push({ first, second, ...proximity, severity: 'warning' });
            }
          }
        }

        for (const pair of closePairs.sort((a, b) => b.overlapArea - a.overlapArea || a.distance - b.distance).slice(0, 20)) {
          findings.push({
            severity: pair.severity,
            type: pair.overlapArea > 1 ? 'interactive-overlap' : 'interactive-gap',
            message:
              pair.overlapArea > 1
                ? `Interactive elements overlap by ${pair.overlapArea}px`
                : `Interactive elements are ${pair.distance}px apart; minimum gap is ${options.minGap}px`,
            selector: `${pair.first.selector} <-> ${pair.second.selector}`,
          });
        }

        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        if (overflow > 2) {
          const offenders = rendered
            .map((element) => ({ selector: selectorFor(element), rect: rectFor(element) }))
            .filter((item) => item.rect.right > window.innerWidth + 2 || item.rect.left < -2)
            .slice(0, 15);

          findings.push({
            severity: 'critical',
            type: 'horizontal-overflow',
            message: `Document is ${overflow}px wider than the viewport`,
            selector: offenders.map((item) => item.selector).join(', '),
            offenders,
          });
        }

        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(isRendered);
        const h1Count = headings.filter((heading) => heading.tagName === 'H1' && isInViewport(heading.getBoundingClientRect())).length;
        if (h1Count !== 1) {
          findings.push({
            severity: 'warning',
            type: 'heading-landmark',
            message: `Viewport has ${h1Count} visible h1 elements; expected 1`,
            selector: headings.map(selectorFor).slice(0, 8).join(', '),
          });
        }

        return {
          findings,
          interactive,
          metrics: {
            clientHeight: document.documentElement.clientHeight,
            clientWidth: document.documentElement.clientWidth,
            scrollHeight: document.documentElement.scrollHeight,
            scrollWidth: document.documentElement.scrollWidth,
          },
        };
      }, viewport);

      const colorPairs = await page.evaluate(() => {
        function isRendered(element) {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            Number(style.opacity) > 0.01 &&
            rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth
          );
        }

        function selectorFor(element) {
          if (element.id) {
            return `#${CSS.escape(element.id)}`;
          }

          const tag = element.tagName.toLowerCase();
          const classes = Array.from(element.classList).slice(0, 2).map((item) => `.${CSS.escape(item)}`).join('');
          return `${tag}${classes}`;
        }

        function effectiveBackground(element) {
          let current = element;
          while (current) {
            const style = window.getComputedStyle(current);
            const background = style.backgroundColor;
            if (background && !/^rgba?\(0,\s*0,\s*0,\s*0\)$/i.test(background) && background !== 'transparent') {
              return background;
            }
            current = current.parentElement;
          }
          return window.getComputedStyle(document.body).backgroundColor || 'rgb(255, 255, 255)';
        }

        return Array.from(document.body.querySelectorAll('*'))
          .filter(isRendered)
          .map((element) => {
            const directText = Array.from(element.childNodes)
              .filter((node) => node.nodeType === Node.TEXT_NODE)
              .map((node) => node.textContent)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            const text = directText || (['A', 'BUTTON', 'LABEL', 'INPUT', 'SELECT', 'TEXTAREA', 'H1', 'H2', 'H3', 'P', 'LI', 'CODE'].includes(element.tagName)
              ? element.textContent?.replace(/\s+/g, ' ').trim()
              : '');

            if (!text) {
              return null;
            }

            const style = window.getComputedStyle(element);
            return {
              backgroundColor: effectiveBackground(element),
              color: style.color,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              selector: selectorFor(element),
              text: text.slice(0, 100),
            };
          })
          .filter(Boolean)
          .slice(0, 250);
      });

      const colors = analyzeColorPairs(colorPairs);
      const result = {
        colors,
        dom,
        scores: calculateScores({ colors, dom }),
        screenshot: `${fileBase}.png`,
        summary: {
          critical: [...dom.findings, ...colors.findings].filter((finding) => finding.severity === 'critical').length,
          warning: [...dom.findings, ...colors.findings].filter((finding) => finding.severity === 'warning').length,
        },
        target,
        viewport,
      };

      results.push(result);
      await writeJson(path.join(REPORT_DIR, `${fileBase}.json`), result);
    }
  }

  const reportPath = path.join(REPORT_DIR, 'index.html');
  await fs.writeFile(reportPath, renderReport(results));
  await writeJson(path.join(REPORT_DIR, 'summary.json'), results);

  await testInfo.attach('UX report', {
    contentType: 'text/html',
    path: reportPath,
  });

  const criticalFindings = results.flatMap((result) =>
    [...result.dom.findings, ...result.colors.findings]
      .filter((finding) => finding.severity === 'critical')
      .map((finding) => ({
        page: result.target.name,
        viewport: result.viewport.name,
        type: finding.type,
        message: finding.message,
        selector: finding.selector,
      })),
  );

  expect(criticalFindings).toEqual([]);
});
