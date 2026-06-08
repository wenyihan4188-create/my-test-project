# Tools Dashboard

A local UI for managing tools in `D:\Tool\AI\MyTools`.

## Start

```powershell
cd D:\Tool\AI\MyTools\tools-dashboard
npm start
```

Open:

```text
http://localhost:4545
```

## Playwright Actions

- Use `全部回放并生成报告` to run every recorded script and refresh the HTML report.
- Use `全部回放并保留 Trace` when you want trace packages for debugging.
- Use `打开测试报告` to open the latest local Playwright HTML report.
- Use `打开最新 Trace` to open the newest `trace.zip` with Playwright Trace Viewer.

## API Tester

- Use `API Tester` to manage pytest + requests API cases.
- API cases are stored in `api-tester/cases`.
- API reports are generated at `api-tester/reports/report.html`.

## Data Generator

- Use `Data Generator` to generate common test data.
- CSV and SQL files are stored in `data-generator/outputs`.
- SQL output is plain `INSERT` script text. Review it before executing against a database.

## File Boundary Generator

- Use `Boundary Files` to generate upload boundary files.
- Supports common images, documents, text files, zip-like files, random binary files, corrupted files, spoofed extensions, and file-name edge cases.
- Files are stored in `file-boundary-generator/outputs`.

## Utility Tools

- Use `Utilities` for small daily-use tools such as image compression and directory tree generation.
- Directory tree text outputs are stored in `utility-tools/outputs`.
