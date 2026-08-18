# Testing And UX Pipeline

LibreUni has a production-style local pipeline for regressions, accessibility, and UX inspection. It builds the production site, serves `dist/` through the same static server used by tests, and writes reports under `reports/`.

## First-Time Setup

```bash
npm install
npm run test:install
```

`test:install` installs the Chromium browser Playwright uses locally. CI installs the same browser with system dependencies.

## Main Commands

```bash
npm run check:required
```

Runs the required pull-request and push gate:

- `npm run check:content` first verifies the router/package/CI contract, then runs lesson structure, course smoke, integrity unit, PlantUML diagnostics, and strict course-integrity checks.
- `npm run check:build` builds the production site and validates rendered lessons, course visuals, and PDFs.
- `npm run check:e2e` runs desktop and mobile Playwright smoke and accessibility checks.
- `npm run check:ux` creates the UX report and fails on hard UX blockers.

Use the complete local release gate before handoff when the change warrants it:

```bash
npm test
# Alias: npm run check:full
```

`check:full` runs `check:required` and Lighthouse. Lighthouse is intentionally a main-branch-only CI check; this is the only difference between the required PR gate and the local full gate.

Useful narrower commands:

```bash
npm run check:content
npm run check:build
npm run check:e2e
npm run check:ux
npm run check:lighthouse
npm run check:visual
npm run test:report
```

The course integrity audit is intentionally separate from `course_stats.py`. Smoke tests answer “is the content mechanically valid?”; integrity checks answer “does the source show signs of padding, duplication, generic artifacts, or uncovered structured sections?” Neither command certifies pedagogical quality. A strict integrity failure must be investigated rather than bypassed by changing thresholds or adding placeholder text.

`test:report` opens the Playwright HTML report from the last run.

`test:visual` builds the app and captures representative interface states under `reports/visual/`. It covers the course catalog at desktop and mobile widths, a course overview, and a lesson across the available theme modes. Run it for every layout, styling, theme, interaction, or accessibility change; inspect the generated images for overlap, clipping, contrast, and responsive failures before handoff.

## What Gets Checked

The Playwright smoke tests verify that key routes render from production builds, browser console/page errors are surfaced, the main course filter works, and mobile navigation opens.

The axe tests scan key pages against WCAG A/AA tags and fail on serious or critical accessibility violations. Full axe details are attached to the Playwright report.

The custom UX audit writes `reports/ux/index.html` plus per-page JSON. It checks:

- Normal WCAG contrast and APCA readability estimates.
- Simulated protanopia, deuteranopia, tritanopia, and achromatopsia contrast risks.
- Interactive target sizes using WCAG 2.2's 24 px minimum and a 44 px recommendation.
- Gaps and overlaps between visible interactive elements.
- Horizontal overflow on desktop and mobile viewports.
- Visible heading sanity checks.

The Lighthouse audit writes reports to `reports/lighthouse` and enforces accessibility, core metadata, and conservative performance/best-practice budgets.

The visual capture test writes PNG files to `reports/visual/`. It is a review aid rather than a pixel-diff gate: agents must inspect its output when their work changes the interface.

## CI

The GitHub Actions workflow in `.github/workflows/quality.yml` invokes the same named `check:content`, `check:build`, `check:e2e`, and `check:ux` layers on pushes and pull requests. It runs `check:lighthouse` only on pushes to `main`, then uploads `reports/` and `test-results/` even when a check fails. This command-level parity is intentional: CI shows each layer separately while preserving the local `check:required` and `check:full` contracts.

## Adding Coverage

Add new high-value routes to:

- `tests/e2e/smoke.spec.mjs` for production smoke checks.
- `tests/e2e/accessibility.spec.mjs` for axe scans.
- `tests/ux/ux-report.spec.mjs` for visual/UX reports.
- `tests/visual/capture.spec.mjs` for representative screenshot coverage.
- `lighthouserc.cjs` for Lighthouse budgets.

Keep the route list small and representative. The goal is fast local signal, not crawling every lesson on every run.

## Theme and Appearance Testing Guidelines

When modifying theme-specific properties, color modes (Light, Dark, Auto), or interactive styling customizers, follow this validation protocol:

### 1. Verification Checklist for Hydration and Reloads
* **Initial Page Mount**: Validate that the initial client-side mount matches the server-rendered color mode. Verify there is no "flash of incorrect mode" or desync where the UI controls show "Light" while the actual elements render "Dark" (or vice versa).
* **Refresh Persistence**:
  1. Toggle to **Light** mode -> Refresh -> Verify mode remains Light.
  2. Toggle to **Dark** mode -> Refresh -> Verify mode remains Dark.
  3. Toggle to **Auto** mode -> Refresh -> Verify mode resolves to dark/light matching system preference (or time-of-day logic).
* **Cross-Theme CSS paste check**: Verify that the selector block copied from the customizer (`html[data-theme='...']`, `html.dark[data-theme='...']`) matches the target selector in `global.css` exactly, preventing variable bleeding between light and dark modes.

### 2. Automated Visual Audit
Run the visual regression suite to capture representative states under various width/mode parameters:
```bash
npm run test:visual
```
Inspect the output files in `reports/visual/` to ensure text readability, correct colors, and contrast compliance.
