# Router Performance Benchmark Scripts

This directory contains comprehensive performance measurement scripts for comparing React Router, TanStack Router, and Next.js implementations using Lighthouse and Puppeteer.

## Overview

These scripts provide reliable, automated performance testing for router implementations.

## Files

- `lighthouse-config.js` - Lighthouse configuration for consistent measurements
- `performance-benchmark.js` - Main benchmark script that measures all router implementations
- `performance-full.js` - Complete performance testing workflow
- `cloudflare-worker-benchmark.js` - Cloudflare Worker environment testing
- `analyze-results.js` - Analysis script to process and compare results
- `generate-report.js` - HTML report generator with charts and visualizations
- `config.js` - Shared configuration for all scripts

## Prerequisites

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Start Development Servers**

   Before running benchmarks, ensure all router implementations are running:

   ```bash
   # Terminal 1: React Router (port 5173)
   pnpm run dev:react-router

   # Terminal 2: TanStack Router (port 5174)
   pnpm run dev:tanstack-router

   # Terminal 3: Next.js (port 5175)
   pnpm run dev:next
   ```

3. **Verify Servers**

   Make sure all servers are accessible:

   - React Router: http://localhost:5173
   - TanStack Router: http://localhost:5174
   - Next.js: http://localhost:5175

## Usage

### Quick Start

Run the complete benchmark suite:

```bash
pnpm run perf
```

This will:

1. Run performance measurements (`perf:measure`)
2. Analyze the results (`perf:analyze`)
3. Generate an HTML report (`perf:report`)

### Individual Commands

#### 1. Run Benchmark Measurements

```bash
pnpm run perf:measure

# Or with custom options:
node scripts/performance-benchmark.js --runs 3 --apps react-router tanstack-router next
```

**Options:**

- `--apps` - Specify which apps to test (default: all)
- `--routes` - Specify which routes to test (default: all)
- `--runs` - Number of measurement runs per test (default: 5)

#### 2. Analyze Results

```bash
pnpm run perf:analyze

# Or analyze specific file:
node scripts/analyze-results.js --file ./reports/benchmark-results.json
```

#### 3. Generate HTML Report

```bash
pnpm run perf:report

# Or with custom output:
node scripts/generate-report.js --output ./my-report.html
```

#### 4. Cloudflare Worker Testing

Test deployed applications on Cloudflare Workers:

```bash
# Make sure you've set up your URLs first (see Configuration section)
node scripts/cloudflare-worker-benchmark.js
```

This will test your deployed applications with Cloudflare-specific optimizations and geographic location simulation.

## Measured Metrics

### Core Web Vitals (Lighthouse)

- **First Contentful Paint (FCP)** - Time until first content appears
- **Largest Contentful Paint (LCP)** - Time until largest content element loads
- **Cumulative Layout Shift (CLS)** - Visual stability metric
- **Total Blocking Time (TBT)** - Time when main thread is blocked
- **Time to Interactive (TTI)** - Time until page becomes fully interactive
- **Speed Index (SI)** - How quickly content is visually displayed

### Additional Metrics

- **Performance Score** - Overall Lighthouse performance score (0-100)
- **Page Performance Timing** - DOM load times and basic page performance
- **Bundle Optimization** - Unused JavaScript/CSS detection
- **Web Vitals (Puppeteer)** - Independent Core Web Vitals measurement

## Configuration

### Environment-Specific URLs

The scripts now support environment-specific URLs to avoid hardcoding personal Cloudflare Worker URLs. This prevents accidental exposure of your personal URLs when pushing to GitHub.

#### Option 1: Environment Variables (Recommended)

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual URLs
REACT_ROUTER_URL=https://your-react-router.workers.dev
TANSTACK_ROUTER_URL=https://your-tanstack-router.workers.dev
NEXT_URL=https://your-next.workers.dev
```

#### Option 2: Local Configuration File

Create a `scripts/local-config.json` file:

```bash
# Copy the template
cp scripts/local-config.template.json scripts/local-config.json

# Edit with your actual URLs
{
  "cloudflare": {
    "apps": [
      {
        "name": "react-router",
        "url": "https://your-react-router.workers.dev",
        "description": "React Router on Cloudflare Workers"
      },
      {
        "name": "tanstack-router",
        "url": "https://your-tanstack-router.workers.dev",
        "description": "TanStack Router on Cloudflare Workers"
      },
      {
        "name": "next",
        "url": "https://your-next.workers.dev",
        "description": "Next.js on Cloudflare Workers"
      }
    ]
  }
}
```

**Security Note**: The `.env` and `scripts/local-config.json` files are automatically excluded from Git commits via `.gitignore`.

### Test Configuration

Edit `CONFIG` object in `performance-benchmark.js`:

### Lighthouse Configuration

Modify `lighthouse-config.js` to adjust:

- Throttling settings
- Device emulation
- Audit categories
- Chrome flags

## Output

### Results Directory

All results are saved to `./reports/`:

- `benchmark-results.json` - Raw benchmark data (latest only)
- `benchmark-analysis.json` - Processed analysis (latest only)
- `report.html` - Interactive HTML report (latest only)

### Console Output

The analyze script provides detailed console output including:

- Performance scores and grades
- Core Web Vitals with color-coded ratings
- Side-by-side comparisons
- Bundle optimization opportunities
- Overall winner determination

### HTML Report

The generated HTML report includes:

- Interactive performance charts
- Detailed metric comparisons
- Performance grades and recommendations
- Raw data inspection
- Mobile-responsive design

## Best Practices

### For Reliable Results

1. **Consistent Environment**: Run tests on the same machine with consistent system load
2. **Multiple Runs**: Use at least 3-5 runs per test for statistical significance
3. **Warmup**: Always include warmup runs to eliminate cold start effects
4. **Isolated Testing**: Close other applications and browser tabs during testing
5. **Network Conditions**: Test under consistent network conditions

### Interpreting Results

- **Green (Good)**: Meets recommended performance thresholds
- **Yellow (Needs Improvement)**: Room for optimization
- **Red (Poor)**: Significant performance issues

#### Performance Thresholds

- FCP: Good ≤ 1.8s, Poor ≥ 3.0s
- LCP: Good ≤ 2.5s, Poor ≥ 4.0s
- CLS: Good ≤ 0.1, Poor ≥ 0.25
- TBT: Good ≤ 200ms, Poor ≥ 600ms
- TTI: Good ≤ 3.8s, Poor ≥ 7.3s

## Troubleshooting

### Common Issues

#### "Server not running" Error

Ensure development servers are started and accessible:

```bash
curl http://localhost:5173  # Should return HTML
curl http://localhost:5174  # Should return HTML
curl http://localhost:5175  # Should return HTML
```

#### Chrome/Puppeteer Issues

If you encounter Chrome-related errors:

```bash
# Install/update Chrome
# On macOS:
brew install --cask google-chrome

# Clear Chrome user data
rm -rf ~/.config/google-chrome/Default
```

#### Memory Issues

For large test suites, you may need to increase Node.js memory:

```bash
node --max-old-space-size=4096 scripts/performance-benchmark.js
```

#### Network Timeouts

Increase timeout values in the configuration if tests fail due to slow loading:

```javascript
// In performance-benchmark.js
const CONFIG = {
  waitTime: 5000, // Increase wait time
  // ...
};
```

### Debugging

Enable verbose logging:

```bash
DEBUG=lighthouse:* node scripts/performance-benchmark.js
```

Check Chrome DevTools during Puppeteer runs:

```javascript
// Temporarily set headless: false in performance-benchmark.js
browser = await puppeteer.launch({
  headless: false, // Shows browser window
  devtools: true, // Opens DevTools
  args: chromeFlags,
});
```

## Advanced Usage

### Custom Routes Testing

Add new routes to test specific application paths:

```javascript
const CONFIG = {
  routes: [
    { name: "posts", path: "/posts", description: "Posts list" },
    { name: "post-detail", path: "/posts/1", description: "Single post" },
    { name: "about", path: "/about", description: "About page" },
  ],
  // ...
};
```

### Network Throttling

Simulate different network conditions by modifying `lighthouse-config.js`:

```javascript
throttling: {
  rttMs: 150,        // 3G: 150ms, 4G: 40ms
  throughputKbps: 1600,  // 3G: 1.6Mbps, 4G: 10Mbps
  cpuSlowdownMultiplier: 4,  // Mobile: 4x, Desktop: 1x
},
```

### Custom Metrics

Add application-specific metrics by extending the measurement functions in `performance-benchmark.js`.

## Contributing

When adding new features or metrics:

1. Follow the existing code structure
2. Add appropriate error handling
3. Include console logging for debugging
4. Update this README with new functionality
5. Test with all router implementations

## References

- [Lighthouse Configuration](https://github.com/GoogleChrome/lighthouse/blob/master/docs/configuration.md)
- [Core Web Vitals](https://web.dev/vitals/)
- [Puppeteer API](https://pptr.dev/)
