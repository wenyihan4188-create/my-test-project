# API Tester

Lightweight API automation powered by `pytest` and `requests`.

## Layout

```text
api-tester/
  cases/
  config/
  reports/
  runner/
```

Cases are stored as JSON files in `cases/`. The pytest runner reads those JSON
files and generates `reports/report.html`.

## Environment

`config/settings.json` stores shared request settings.

- `base_url`: the shared host prefix for APIs, for example `http://kdtx-test.itheima.net`.
  A case can then use `/api/login` instead of the full URL.
- `headers`: headers applied to every case, for example:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{token}}"
}
```

Case-level headers override global headers.

## Dynamic Values

Use `extract` to save a value from one response, then use `{{variableName}}` in a
later case.

Captcha example:

```json
{
  "name": "001-captcha",
  "order": 1,
  "method": "GET",
  "path": "/api/captchaImage",
  "extract": [
    { "name": "uuid", "type": "json", "path": "uuid" }
  ],
  "assertions": [
    { "type": "status_code", "expected": 200 }
  ]
}
```

Login example:

```json
{
  "name": "002-login",
  "order": 2,
  "method": "POST",
  "path": "/api/login",
  "headers": { "Content-Type": "application/json" },
  "body": {
    "username": "admin",
    "password": "HM_2023_test",
    "code": "2",
    "uuid": "{{uuid}}"
  },
  "assertions": [
    { "type": "status_code", "expected": 200 }
  ]
}
```

Run all cases when a case depends on a variable extracted by a previous case.

## Postman Import

Export a Postman Collection as JSON, then use the dashboard `导入 Postman` button.
The importer creates one JSON case per request with:

- request method, URL path, query params, headers, and JSON/raw body
- default `status_code == 200` assertion
- empty `extract`, so you can add dynamic variables after import

Postman scripts are not converted automatically yet. Keep complex assertions in
this tool's `assertions` field after import.

## Reports

`pytest-html` generates the detailed report at `reports/report.html`. The
dashboard reads `reports/summary.json` to show a quick board with total, passed,
failed, duration, and each case's latest result.

## Load Test

The dashboard can run a lightweight load test from an existing API case. Choose a
case, set concurrency, total requests, and timeout. Results include success,
failure, QPS, average response time, min/max response time, and P95.

Load test reports are saved in `reports/load-test-*.json` and
`reports/load-test-*.csv`.

## Run

```powershell
cd D:\Tool\AI\MyTools\api-tester
pytest -p no:cacheprovider runner --html reports/report.html --self-contained-html
```
