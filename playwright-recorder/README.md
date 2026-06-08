# Playwright Recorder

Record browser actions with Playwright codegen, then replay the generated script.

## Install

```powershell
cd D:\Tool\AI\MyTools\playwright-recorder
npm install
npm run install:browsers
```

## Record

```powershell
npm run record -- --name login-demo --url https://example.com
```

This opens a browser and Playwright Inspector. Interact with the page, then close
the inspector when finished. The generated test is saved to:

```text
recordings/login-demo.spec.js
```

## Replay

```powershell
npm run replay -- --name login-demo
```

Useful options:

```powershell
npm run replay -- --name login-demo --headed
npm run replay -- --name login-demo --trace
npm run replay -- --file recordings/login-demo.spec.js
```

## Locator Hardening

Recordings can be hardened from the dashboard with `增强定位`. This rewrites
common exact text clicks into helper calls with fallback locators, which helps
when product names, order numbers, or button text change slightly.

The helper lives in:

```text
support/robust-actions.js
```

## List Recordings

```powershell
npm run list
```

## Directory Layout

```text
playwright-recorder/
  package.json
  playwright.config.js
  scripts/
    record.js
    replay.js
    list-recordings.js
  recordings/
    .gitkeep
  traces/
    .gitkeep
```
