import json
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
CASES_DIR = ROOT / "cases"
CONFIG_FILE = ROOT / "config" / "settings.json"
REPORTS_DIR = ROOT / "reports"
SUMMARY_FILE = REPORTS_DIR / "summary.json"
_RESULTS = []


def pytest_addoption(parser):
    parser.addoption("--case", action="store", default=None, help="Run one API case by name")


@pytest.fixture(scope="session")
def settings():
    if not CONFIG_FILE.exists():
        return {"base_url": "", "headers": {}}
    return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def api_context():
    return {}


def pytest_generate_tests(metafunc):
    if "api_case" not in metafunc.fixturenames:
        return

    selected_case = metafunc.config.getoption("--case")
    cases = load_cases()
    if selected_case:
        cases = [case for case in cases if case["name"] == selected_case]

    ids = [case["name"] for case in cases]
    metafunc.parametrize("api_case", cases, ids=ids)


def load_cases():
    cases = []
    for file_path in sorted(CASES_DIR.glob("*.json")):
        case = json.loads(file_path.read_text(encoding="utf-8"))
        case.setdefault("name", file_path.stem)
        case.setdefault("order", 1000)
        case["_file"] = str(file_path)
        cases.append(case)
    return sorted(cases, key=lambda case: (case.get("order", 1000), case["name"]))


def pytest_sessionstart(session):
    _RESULTS.clear()
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    if SUMMARY_FILE.exists():
        SUMMARY_FILE.unlink()


def pytest_runtest_logreport(report):
    if report.when != "call":
        return

    _RESULTS.append({
        "nodeid": report.nodeid,
        "name": report.nodeid.split("[")[-1].rstrip("]"),
        "outcome": report.outcome,
        "duration": round(report.duration, 3),
        "message": report.longreprtext if report.failed else ""
    })


def pytest_sessionfinish(session, exitstatus):
    passed = sum(1 for item in _RESULTS if item["outcome"] == "passed")
    failed = sum(1 for item in _RESULTS if item["outcome"] == "failed")
    skipped = sum(1 for item in _RESULTS if item["outcome"] == "skipped")
    summary = {
        "total": len(_RESULTS),
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "exitstatus": exitstatus,
        "duration": round(sum(item["duration"] for item in _RESULTS), 3),
        "results": _RESULTS
    }
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_FILE.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
