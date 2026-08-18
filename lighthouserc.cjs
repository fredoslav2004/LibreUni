module.exports = {
  urls: [
    'http://127.0.0.1:4321/',
    'http://127.0.0.1:4321/lessons/python/intro.html',
  ],
  settings: {
    preset: 'desktop',
    skipAudits: ['uses-http2'],
  },
  assertions: {
    'button-name': 'error',
    'categories:accessibility': ['error', { minScore: 0.9 }],
    'categories:best-practices': ['warn', { minScore: 0.85 }],
    'categories:performance': ['warn', { minScore: 0.65 }],
    'categories:seo': ['warn', { minScore: 0.85 }],
    'color-contrast': 'error',
    'document-title': 'error',
    'html-has-lang': 'error',
    'image-alt': 'warn',
    'link-name': 'error',
    'meta-description': 'warn',
  },
  outputDir: 'reports/lighthouse',
};
