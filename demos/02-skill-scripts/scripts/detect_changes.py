#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "python-frontmatter>=1.1",
# ]
# ///

import json
import sys
from pathlib import Path
from datetime import datetime, timezone

import frontmatter

STATE_FILE = Path(__file__).parent.parent / "state" / "last-run.json"
SOURCES_DIR = Path(__file__).parent.parent / "sources"


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state: dict):
    STATE_FILE.parent.mkdir(exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False))


def main():
    state = load_state()
    changed = []
    skipped = []

    for path in sorted(SOURCES_DIR.glob("*.md")):
        mtime = path.stat().st_mtime
        last = state.get(path.name, 0)

        post = frontmatter.load(path)
        meta = {
            "file": path.name,
            "title": post.get("title", path.stem),
            "updated": datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat(),
        }

        if mtime > last:
            changed.append(meta)
        else:
            skipped.append(path.name)

        state[path.name] = mtime

    save_state(state)
    result = {"changed": changed, "skipped": skipped, "run_at": datetime.now(tz=timezone.utc).isoformat()}
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
