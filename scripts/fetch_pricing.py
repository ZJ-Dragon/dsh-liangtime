#!/usr/bin/env python3
"""Read DeepSeek's peak/off-peak windows from the official API pricing page.

The script prints exactly one JSON object on stdout. The Host half consumes it
without parsing free-form text. Network and parsing failures are reported in
that JSON object, so a failed sync never crashes the plugin process.

No third-party packages are required: urllib + html.parser + re cover the
Docusaurus pricing page, including its rendered table footnotes.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

CHINESE_URL = "https://api-docs.deepseek.com/zh-cn/quick_start/pricing"
ENGLISH_URL = "https://api-docs.deepseek.com/quick_start/pricing"
TIMEOUT_SECONDS = 10
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) dsh-liangTime/1.0"
)

CHINESE_WEEKDAYS = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "日": 0,
    "天": 0,
}
ENGLISH_WEEKDAYS = {
    "monday": 1,
    "tuesday": 2,
    "wednesday": 3,
    "thursday": 4,
    "friday": 5,
    "saturday": 6,
    "sunday": 0,
}

BLOCK_TAGS = {
    "p", "li", "td", "th", "tr", "div", "section", "article", "h1", "h2",
    "h3", "h4", "h5", "h6", "br", "ul", "ol", "table",
}
SKIP_TAGS = {"script", "style", "noscript", "template", "svg"}


class TextExtractor(HTMLParser):
    """Collect visible page text, keeping block boundaries as newlines."""

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
        raw = "".join(self.parts)
        raw = raw.replace("\xa0", " ")
        raw = re.sub(r"[ \t\r\f\v]+", " ", raw)
        raw = re.sub(r"\n\s*\n+", "\n", raw)
        return raw.strip()


def fetch(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
        },
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def page_text(html: str) -> str:
    parser = TextExtractor()
    parser.feed(html)
    parser.close()
    return parser.text()


def intervals_from_segment(segment: str) -> list[dict[str, int]]:
    pattern = re.compile(
        r"(\d{1,2})\s*[:：]\s*(\d{2})\s*(?:-|–|—|~|～|至|到|to)\s*"
        r"(\d{1,2})\s*[:：]\s*(\d{2})",
        re.IGNORECASE,
    )
    seen: set[tuple[int, int]] = set()
    intervals: list[dict[str, int]] = []
    for hour1, minute1, hour2, minute2 in pattern.findall(segment):
        start_hour, start_minute = int(hour1), int(minute1)
        end_hour, end_minute = int(hour2), int(minute2)
        if start_hour > 23 or end_hour > 23:
            continue
        if start_minute > 59 or end_minute > 59:
            continue
        start = start_hour * 60 + start_minute
        end = end_hour * 60 + end_minute
        if start == end:
            continue
        # A window ending at 24:00 is represented as the end of the day.
        if end == 0 and start > 0:
            end = 24 * 60
        if start >= end:
            continue
        key = (start, end)
        if key not in seen:
            seen.add(key)
            intervals.append({"start": start, "end": end})
    return sorted(intervals, key=lambda item: item["start"])


def weekdays_from_chinese(segment: str) -> list[int] | None:
    if "工作日" in segment:
        return [1, 2, 3, 4, 5]
    range_match = re.search(
        r"(?:周|星期)\s*([一二三四五六日天])\s*(?:至|到|-|~|～)\s*"
        r"(?:周|星期)\s*([一二三四五六日天])",
        segment,
    )
    if range_match:
        start = CHINESE_WEEKDAYS[range_match.group(1)]
        end = CHINESE_WEEKDAYS[range_match.group(2)]
        days: list[int] = []
        current = start
        for _ in range(7):
            days.append(current)
            if current == end:
                break
            current = (current + 1) % 7
        if len(days) == 7 and start != (end + 1) % 7:
            return None
        return days
    names = re.findall(r"(?:周|星期)\s*([一二三四五六日天])", segment)
    if names:
        return sorted({CHINESE_WEEKDAYS[name] for name in names})
    return None


def weekdays_from_english(segment: str) -> list[int] | None:
    if re.search(r"weekdays?", segment, re.IGNORECASE):
        return [1, 2, 3, 4, 5]
    range_match = re.search(
        r"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*"
        r"(?:through|to|-|–|—)\s*"
        r"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)",
        segment,
        re.IGNORECASE,
    )
    if range_match:
        start = ENGLISH_WEEKDAYS[range_match.group(1).lower()]
        end = ENGLISH_WEEKDAYS[range_match.group(2).lower()]
        days: list[int] = []
        current = start
        for _ in range(7):
            days.append(current)
            if current == end:
                break
            current = (current + 1) % 7
        if len(days) == 7 and start != (end + 1) % 7:
            return None
        return days
    names = re.findall(
        r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
        segment,
        re.IGNORECASE,
    )
    if names:
        return sorted({ENGLISH_WEEKDAYS[name.lower()] for name in names})
    return None


def normalize_days(days: list[int] | None) -> list[int]:
    if not days:
        return [1, 2, 3, 4, 5]
    return sorted(set(days))


def shift_to_beijing(
    intervals: list[dict[str, int]], days: list[int]
) -> tuple[list[dict[str, int]], list[int]]:
    """Convert UTC windows to Asia/Shanghai (UTC+8), rolling the weekday.

    Windows that would cross midnight after the shift cannot be represented by
    one same-day interval list, so they are rejected instead of publishing a
    silently wrong window.
    """
    shifted: list[dict[str, int]] = []
    shifted_days: set[int] = set()
    for interval in intervals:
        raw_start = interval["start"] + 8 * 60
        raw_end = interval["end"] + 8 * 60
        day_shift = raw_start // (24 * 60)
        start = raw_start % (24 * 60)
        end = raw_end % (24 * 60)
        if raw_end > 0 and end == 0:
            end = 24 * 60
        if start >= end:
            return [], []
        shifted.append({"start": start, "end": end})
        for day in days:
            shifted_days.add((day + day_shift) % 7)
    return shifted, sorted(shifted_days)


def parse_chinese(text: str) -> dict | None:
    anchor = text.find("北京时间")
    if anchor < 0:
        return None
    peak_marker = text.find("高峰时段", anchor)
    if peak_marker < 0:
        peak_marker = text.find("高峰", anchor)
    if peak_marker < 0:
        return None
    # Include the marker itself: the sentence reads "... 为高峰时段".
    segment = text[anchor:peak_marker + len("高峰时段")]
    # The page can wrap the sentence across block boundaries; keep a bound.
    segment = re.sub(r"\s+", " ", segment)[:240]
    intervals = intervals_from_segment(segment)
    if not intervals:
        return None
    if "高峰时段" not in segment:
        return None
    if not re.search(r"北京|中国|UTC\+8|UTC\+08", segment):
        return None
    days = weekdays_from_chinese(segment)
    return {
        "timezone": "Asia/Shanghai",
        "days": normalize_days(days),
        "intervals": intervals,
        "matchedText": segment[:200],
        "source": CHINESE_URL,
        "language": "zh",
    }


def parse_english(text: str) -> dict | None:
    anchor = re.search(r"peak hours?\s+(?:are|is)", text, re.IGNORECASE)
    if anchor is None:
        return None
    segment = text[anchor.start():anchor.start() + 320]
    segment = re.sub(r"\s+", " ", segment)
    # Stop before the off-peak explanation, which repeats no peak hours.
    stop = re.search(r"off-peak|all other hours", segment, re.IGNORECASE)
    if stop is not None and stop.start() > 20:
        segment = segment[:stop.start()]
    intervals = intervals_from_segment(segment)
    if not intervals:
        return None
    already_beijing = re.search(
        r"beijing|utc\s*\+\s*8|gmt\s*\+\s*8", segment, re.IGNORECASE
    ) is not None
    if not already_beijing and re.search(r"\bUTC\b|\bGMT\b", segment, re.IGNORECASE) is None:
        return None
    days = normalize_days(weekdays_from_english(segment))
    if not already_beijing:
        intervals, days = shift_to_beijing(intervals, days)
        if not intervals:
            return None
    return {
        "timezone": "Asia/Shanghai",
        "days": days,
        "intervals": intervals,
        "matchedText": segment[:200],
        "source": ENGLISH_URL,
        "language": "en",
    }


def schedule_from_text(text: str) -> dict | None:
    chinese = parse_chinese(text)
    if chinese is not None:
        return chinese
    return parse_english(text)


def fallback_schedule() -> dict:
    return {
        "timezone": "Asia/Shanghai",
        "days": [1, 2, 3, 4, 5],
        "intervals": [
            {"start": 9 * 60, "end": 12 * 60},
            {"start": 14 * 60, "end": 18 * 60},
        ],
        "source": CHINESE_URL,
        "language": "fallback",
        "matchedText": "built-in fallback: Mon-Fri 09:00-12:00, 14:00-18:00 Asia/Shanghai",
    }


def main() -> int:
    errors: list[str] = []
    for url, parser in ((CHINESE_URL, "zh"), (ENGLISH_URL, "en")):
        try:
            html = fetch(url)
            text = page_text(html)
            parsed = parse_chinese(text) if parser == "zh" else parse_english(text)
            if parsed is None:
                errors.append(f"{url}: no peak-hours expression matched")
                continue
            parsed["ok"] = True
            parsed["fetchedAt"] = datetime.now(timezone.utc).isoformat()
            print(json.dumps(parsed, ensure_ascii=False))
            return 0
        except Exception as error:  # noqa: BLE001 - report every failure in JSON
            errors.append(f"{url}: {type(error).__name__}: {error}")

    fallback = fallback_schedule()
    fallback.update({
        "ok": False,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "error": "; ".join(errors) or "no pricing page could be parsed",
    })
    print(json.dumps(fallback, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
