import re
from urllib.parse import urljoin

import requests


VARIABLE_PATTERN = re.compile(r"\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}")


def test_api_case(api_case, settings, api_context):
    base_url = settings.get("base_url", "")
    url = build_url(base_url, render_value(api_case.get("path", ""), api_context))
    headers = {}
    headers.update(render_value(settings.get("headers") or {}, api_context))
    headers.update(render_value(api_case.get("headers") or {}, api_context))

    response = requests.request(
        method=api_case.get("method", "GET"),
        url=url,
        headers=headers,
        params=render_value(api_case.get("params") or None, api_context),
        json=render_value(api_case.get("body"), api_context),
        timeout=api_case.get("timeout", 30),
    )

    for assertion in api_case.get("assertions", []):
        assert_response(response, assertion)

    for extraction in api_case.get("extract", []):
        extract_value(response, extraction, api_context)


def build_url(base_url, path):
    if path.startswith("http://") or path.startswith("https://"):
        return path
    if not base_url:
        return path
    return urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))


def assert_response(response, assertion):
    assertion_type = assertion.get("type")

    if assertion_type == "status_code":
        expected = assertion.get("expected")
        assert response.status_code == expected
        return

    if assertion_type == "json_equals":
        actual = read_json_path(response.json(), assertion.get("path", ""))
        expected = assertion.get("expected")
        assert actual == expected
        return

    if assertion_type == "json_exists":
        read_json_path(response.json(), assertion.get("path", ""))
        return

    raise AssertionError(f"Unsupported assertion type: {assertion_type}")


def extract_value(response, extraction, api_context):
    name = extraction.get("name")
    if not name:
        raise AssertionError("Extraction name is required")

    extraction_type = extraction.get("type", "json")
    if extraction_type != "json":
        raise AssertionError(f"Unsupported extraction type: {extraction_type}")

    api_context[name] = read_json_path(response.json(), extraction.get("path", ""))


def render_value(value, api_context):
    if isinstance(value, str):
        return VARIABLE_PATTERN.sub(lambda match: stringify_variable(match.group(1), api_context), value)
    if isinstance(value, list):
        return [render_value(item, api_context) for item in value]
    if isinstance(value, dict):
        return {key: render_value(item, api_context) for key, item in value.items()}
    return value


def stringify_variable(name, api_context):
    if name not in api_context:
        raise AssertionError(f"Variable '{name}' was not extracted yet. Run its previous API case first.")
    return str(api_context[name])


def read_json_path(payload, json_path):
    current = payload
    if not json_path:
        return current

    for part in json_path.split("."):
        if isinstance(current, list):
            current = current[int(part)]
            continue
        current = current[part]

    return current
