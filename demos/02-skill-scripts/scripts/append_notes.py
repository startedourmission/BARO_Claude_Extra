#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

import json
import sys
from datetime import date
from pathlib import Path

NOTES_FILE = Path(__file__).parent.parent / "release-notes.md"


def main():
    if len(sys.argv) < 2:
        print("Usage: append_notes.py '<JSON summary>'", file=sys.stderr)
        sys.exit(1)

    try:
        summaries = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        print(f"JSON 파싱 오류: {e}", file=sys.stderr)
        sys.exit(1)

    today = date.today().isoformat()
    section = f"\n## {today}\n\n"

    for item in summaries:
        title = item.get("title", "제목 없음")
        summary = item.get("summary", "")
        section += f"- **{title}**: {summary}\n"

    if NOTES_FILE.exists():
        existing = NOTES_FILE.read_text(encoding="utf-8")
    else:
        existing = "# 릴리스 노트\n"

    NOTES_FILE.write_text(existing + section, encoding="utf-8")
    print(f"✓ {today} 섹션에 {len(summaries)}건 추가 완료")


if __name__ == "__main__":
    main()
