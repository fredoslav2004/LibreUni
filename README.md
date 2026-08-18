<div align="center">
  <h1>🎓 LibreUni</h1>
  <p>
    <strong>A free, open-source education platform democratizing high-quality, university-level learning.</strong>
  </p>
  <p>
    No sign-in. No ads. No paywalls. Just serious content for serious learners.
  </p>
  
  [![License](https://img.shields.io/badge/License-Dual-blue.svg)](#-license)
  [![Astro](https://img.shields.io/badge/Astro-0C111A?logo=astro&logoColor=white)](https://astro.build/)
  [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![MDX](https://img.shields.io/badge/MDX-1B1F24?logo=mdx&logoColor=white)](https://mdxjs.com/)
</div>

<hr />

## 📖 Table of Contents

- [Philosophy](#-philosophy)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🧠 Philosophy

**Equality of opportunity.**

LibreUni is built on the belief that high-quality, university-level education should be accessible to everyone, everywhere, for free. We prioritize dense content rather than unnecessary bloat.

## ✨ Features

- 📚 **Comprehensive Curriculum:** University-level courses ranging from C/C++ and Git to Machine Learning and Philosophy.
- ⚡ **Interactive Learning:** Built-in interactive components like `<Quiz />` and `<CodeRunner />`.
- 📊 **Rich Content:** Support for KaTeX (mathematical typesetting) and PlantUML (architecture diagrams) within lessons.
- 🚀 **Blazing Fast:** Powered by Astro for static site generation and optimal performance.
- 🌙 **Dark Mode:** First-class dark mode support for late-night study sessions.

## 🛠️ Tech Stack

- **Framework:** [Astro](https://astro.build/)
- **UI Components:** React + Tailwind CSS
- **Content Management:** MDX with custom remark/rehype plugins
- **Diagrams & Math:** PlantUML & KaTeX
- **Validation:** Python scripts for content integrity

## 📂 Project Structure

```text
LibreUni/
├── src/                       # Pages, components, and course content
├── astro.config.mjs           # Astro configuration
├── package.json               # Application dependencies and scripts
├── .github/
│   └── workflows/             # CI: quality checks, scheduled maintenance, Dependabot
├── docker/
│   └── nginx.conf             # Production nginx config
├── docs/                      # Technical references (UX, PlantUML, Rules)
├── scripts/                   # Content validation utilities
├── tests/
│   ├── e2e/                   # Playwright smoke tests
│   ├── ux/                    # UX audit (contrast, spacing, overflow)
│   └── visual/                # Visual regression capture
├── tools/                     # Build and test helpers
├── Dockerfile                 # Multi-stage static site builder
├── lighthouserc.cjs           # Lighthouse audit config
├── playwright.config.mjs      # Playwright test config
└── package-lock.json          # Locked dependencies
```

## 🚀 Getting Started

Follow these steps to set up the project locally for development.

### Prerequisites

- Node.js 26 (the CI/container runtime; Node.js >=22.12.0 is supported by the package engine)
- Python 3.x (for running content validation scripts)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the main Astro site locally:**
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:4321`.

3. **Validate content and refresh catalog quality data (Optional but recommended):**
   ```bash
   python3 scripts/course_stats.py
   python3 scripts/course_stats.py --write-quality
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## ✅ Testing

Run the local quality pipeline with:

```bash
npm run test:install
npm run check:required
```

`check:required` runs content, build, desktop/mobile browser, and UX gates. Run `npm test` (alias for `npm run check:full`) before a release-quality handoff to add Lighthouse. CI runs the required layers on pushes and pull requests, with Lighthouse intentionally limited to pushes on `main`. See [docs/agent-rules/VALIDATION.md](docs/agent-rules/VALIDATION.md) for the full command list and report locations.

### CI Pipeline

| Workflow | Trigger | Jobs |
|---|---|---|
| `quality.yml` | Push/PR on main | Named content → build → e2e → UX gates; Lighthouse, badges, and Pages deploy on `main` pushes |
| `scheduled.yml` | Weekly Sunday | Dead link check, dependency audit (opens issues on failure) |
| `dependabot.yml` | Monthly | Auto PRs for npm and Actions dependency updates |

## 🚢 Deployment

### Local Docker Testing

This repository includes a production-ready multi-stage [Dockerfile](Dockerfile) that builds the static site and serves it with Nginx.

The runtime includes:
- Static route handling for extensionless HTML routes.
- Long-lived immutable caching for fingerprinted assets.
- Gzip compression for text assets.
- Basic security headers.
- Health endpoint at `/healthz`.

To build and run locally with Docker:

1. **Build the image:**
   ```bash
   docker build -t libreuni .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 8080:80 --name libreuni-test libreuni
   ```

3. **Verify:**
   `curl http://localhost:8080/healthz`

### Coolify setup

If you deploy with Coolify and want automatic builds from source:

1. Use **Build Pack: Dockerfile**.
2. Keep repository root as the build context.
3. Set service internal port to **80**.
4. Set healthcheck path to `/healthz`.

If you prefer Coolify's source/static flow instead of Docker:

1. Keep the repository root as the base directory.
2. Use `npm install` as the install command.
3. Use `npm run build` as the build command.
4. Publish `dist` as the static output directory.

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing a typo, adding a new lesson, or improving the platform's features, your help is appreciated.

**Before you start:**
Please read our [agent router](AGENTS.md) first. It sends each task through a shared baseline and the relevant rules under [docs/agent-rules](docs/agent-rules/), including the general rules for lesson structure, writing style, and quality standards.

AI agents and coding assistants must also start with [AGENTS.md](AGENTS.md), which points to the required project rules, sourcing workflow, UX guidance, validation commands, and the small Git-reviewed context for durable decisions.

All coding harnesses use the same repository router. Course work, research, UI changes, PlantUML, and validation each have focused guidance under [docs/agent-rules](docs/agent-rules/); the harness does not select a different LibreUni workflow.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under a Dual License - see the [LICENSE](LICENSE) file for complete details on open source usage and commercial restrictions.
