/**
 * Lighthouse configuration for router performance testing
 * Based on best practices from https://github.com/addyosmani/puppeteer-webperf
 */

const lighthouseConfig = {
  extends: "lighthouse:default",
  settings: {
    // Disable storage reset between tests for consistency
    disableStorageReset: false,
    // Use provided throttling settings
    throttlingMethod: "provided",
    // Form factor
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    emulatedUserAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    // Network and CPU throttling for consistent results
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024, // 10 Mbps
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    // Skip certain audits that aren't relevant for router comparison
    skipAudits: [
      "canonical",
      "robots-txt",
      "hreflang",
      "structured-data",
      "meta-description",
      "document-title",
    ],
    // Number of runs for reliability
    runs: 3,
    // Only gather performance, not accessibility, SEO, etc.
    onlyCategories: ["performance"],
  },
  // Custom audit groups
  groups: {
    metrics: {
      title: "Metrics",
      description: "Performance metrics",
    },
    "load-opportunities": {
      title: "Opportunities",
      description: "Suggestions to reduce loading time",
    },
    diagnostics: {
      title: "Diagnostics",
      description: "More information about performance",
    },
  },
  // Custom audit categories focusing on router performance
  categories: {
    performance: {
      title: "Router Performance",
      description: "Metrics for router transition and navigation performance",
      auditRefs: [
        // Core Web Vitals
        { id: "first-contentful-paint", weight: 10, group: "metrics" },
        { id: "largest-contentful-paint", weight: 25, group: "metrics" },
        { id: "cumulative-layout-shift", weight: 25, group: "metrics" },
        { id: "total-blocking-time", weight: 30, group: "metrics" },
        { id: "speed-index", weight: 10, group: "metrics" },

        // Load performance
        { id: "interactive", weight: 0, group: "load-opportunities" },
        { id: "max-potential-fid", weight: 0, group: "load-opportunities" },

        // Bundle analysis
        { id: "unused-javascript", weight: 0, group: "load-opportunities" },
        { id: "unused-css-rules", weight: 0, group: "load-opportunities" },
        { id: "unminified-javascript", weight: 0, group: "load-opportunities" },
        { id: "unminified-css", weight: 0, group: "load-opportunities" },

        // Network efficiency
        { id: "uses-text-compression", weight: 0, group: "load-opportunities" },
        {
          id: "uses-responsive-images",
          weight: 0,
          group: "load-opportunities",
        },
        {
          id: "efficient-animated-content",
          weight: 0,
          group: "load-opportunities",
        },

        // JavaScript execution
        { id: "bootup-time", weight: 0, group: "diagnostics" },
        { id: "mainthread-work-breakdown", weight: 0, group: "diagnostics" },
        { id: "third-party-summary", weight: 0, group: "diagnostics" },
      ],
    },
  },
};

// Chrome flags for consistent testing environment
const chromeFlags = [
  "--headless=new",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-features=TranslateUI",
  "--disable-ipc-flooding-protection",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--no-first-run",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-component-extensions-with-background-pages",
  "--disable-background-networking",
  "--disable-sync",
  "--metrics-recording-only",
  "--no-default-browser-check",
  "--mute-audio",
  "--no-pings",
  "--password-store=basic",
  "--use-mock-keychain",
  "--disable-device-discovery-notifications",
];

export { lighthouseConfig, chromeFlags };
