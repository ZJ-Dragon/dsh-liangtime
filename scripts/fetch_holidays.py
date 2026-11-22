#!/usr/bin/env python3
"""Read China's official public-holiday schedule from gov.cn.

The search endpoint named in the product requirements supplies the release
pages; the release page itself supplies the actual holiday date ranges. The
script prints one JSON object on stdout and never raises for network or parse
failures, so the Host can show a recoverable sync status.

No third-party packages are required.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from html import unescape
from html.parser import HTMLParser

SEARCH_URL = "https://sousuo.www.gov.cn/search-gov/data"
TIMEOUT_SECONDS = 12
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) dsh-liangTime/2.0"
)
BEIJING = timezone(timedelta(hours=8))
HOLIDAY_TITLE = re.compile(r"(\d{4})年部分节假日安排的通知")
DATE_RANGE = re.compile(
    r"(?P<m1>\d{1,2})月(?P<d1>\d{1,2})日"
    r"(?:（[^）]*）)?"
    r"(?:\s*(?:至|—|–|-|~|～)\s*"
    r"(?:(?P<m2>\d{1,2})月)?(?P<d2>\d{1,2})日(?:（[^）]*）)?)?"
    r"\s*(?:放假|放假调休)"
)
BLOCK_TAGS = {
    "p", "li", "td", "th", "tr", "div", "section", "article", "h1", "h2",
    "h3", "h4", "h5", "h6", "br", "ul", "ol", "table",
}
SKIP_TAGS = {"script", "style", "noscript", "template", "svg"}


class TextExtractor(HTMLParser):
    """Collect visible page text with block boundaries preserved."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in SKIP_TAGS:
            self.skip_depth += 1
        elif tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
        elif tag in BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.skip_depth:
            self.parts.append(data)

    def text(self) -> str:
        raw = "".join(self.parts).replace("\xa0", " ")
        raw = re.sub(r"[ \t\r\f\v]+", " ", raw)
        raw = re.sub(r"\n\s*\n+", "\n", raw)
        return raw.strip()


def fetch(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
        },
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def strip_markup(value: str) -> str:
    return unescape(re.sub(r"<[^>]+>", "", value or "")).strip()


def search_notices() -> tuple[list[dict], list[str]]:
    """Query gov.cn for holiday notices and return the newest release per year."""
    params = {
        "t": "zhengcelibrary",
        "q": "部分节假日安排的通知",
        "searchfield": "title",
        "sort": "pubtime",
        "sortType": "1",
        "p": "0",
        "n": "30",
        "type": "gwyzcwjk",
    }
    payload = json.loads(fetch(f"{SEARCH_URL}?{urllib.parse.urlencode(params)}"))
    if payload.get("code") not in (0, 200):
        raise RuntimeError(f"search API returned code {payload.get('code')!r}")
    cat_map = payload.get("searchVO", {}).get("catMap", {})
    items: list[dict] = []
    for category in ("gongwen", "gongbao"):
        for item in cat_map.get(category, {}).get("listVO", []):
            title = strip_markup(item.get("title", ""))
            match = HOLIDAY_TITLE.search(title)
            url = item.get("url") or item.get("piclinksurl") or ""
            if match is None or not url:
                continue
            items.append({
                "year": int(match.group(1)),
                "title": title,
                "url": url,
                "pubtime": item.get("pubtime"),
                "category": category,
            })
    # Keep the latest release row per year, preferring the policy-file view.
    selected: dict[int, dict] = {}
    for item in items:
        previous = selected.get(item["year"])
        if previous is None:
            selected[item["year"]] = item
            continue
        if previous["category"] != "gongwen" and item["category"] == "gongwen":
            selected[item["year"]] = item
    return list(selected.values()), []


def page_text(html: str) -> str:
    parser = TextExtractor()
    parser.feed(html)
    parser.close()
    return parser.text()


def parse_notice(year: int, html: str) -> tuple[list[str], list[str]]:
    """Extract holiday dates from one official notice page."""
    text = page_text(html)
    normalized = re.sub(r"\s+", " ", text)
    holidays: set[str] = set()
    matched: list[str] = []
    for match in DATE_RANGE.finditer(normalized):
        try:
            start_month = int(match.group("m1"))
            start_day = int(match.group("d1"))
            end_month = int(match.group("m2") or start_month)
            end_day = int(match.group("d2") or start_day)
            start = date(year, start_month, start_day)
            end = date(year, end_month, end_day)
        except ValueError:
            continue
        if end < start:
            try:
                end = date(year + 1, end_month, end_day)
            except ValueError:
                continue
        span = (end - start).days
        if span < 0 or span > 31:
            continue
        cursor = start
        while cursor <= end:
            holidays.add(cursor.isoformat())
            cursor += timedelta(days=1)
        matched.append(match.group(0))
    return sorted(holidays), matched[:12]


def main() -> int:
    errors: list[str] = []
    today = datetime.now(BEIJING).date()
    current_year = today.year
    notices: list[dict] = []
    parsed: list[dict] = []
    try:
        found, search_errors = search_notices()
        errors.extend(search_errors)
        if not found:
            raise RuntimeError("no holiday notice found in the search response")
        years = {item["year"] for item in found}
        latest_year = max(years)
        targets = sorted({current_year, latest_year, current_year + 1})
        for target in targets:
            item = next((candidate for candidate in found if candidate["year"] == target), None)
            if item is None:
                continue
            try:
                html = fetch(item["url"])
                holidays, matched = parse_notice(item["year"], html)
                if not holidays:
                    errors.append(f"{item['year']}: no holiday date range matched")
                    continue
                entry = {
                    "year": item["year"],
                    "title": item["title"],
                    "url": item["url"],
                    "holidays": holidays,
                    "matchedTexts": matched,
                }
                parsed.append(entry)
                notices.append({
                    "year": item["year"],
                    "title": item["title"],
                    "url": item["url"],
                    "holidayCount": len(holidays),
                })
            except Exception as error:  # noqa: BLE001 - one year must not kill the rest
                errors.append(f"{item['year']}: {type(error).__name__}: {error}")
    except Exception as error:  # noqa: BLE001 - report all failures as JSON
        errors.append(f"search: {type(error).__name__}: {error}")

    merged = sorted({day for entry in parsed for day in entry["holidays"]})
    result = {
        "ok": bool(merged),
        "source": SEARCH_URL,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "notices": notices,
        "holidays": merged,
        "errors": errors,
    }
    if parsed:
        result["matchedTexts"] = [text for entry in parsed for text in entry["matchedTexts"]]
    if not merged:
        result["error"] = "; ".join(errors) or "no holiday dates could be parsed"
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
