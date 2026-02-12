#!/usr/bin/env python3
import json
import shutil
from pathlib import Path


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    dist = root / "dist"

    config_path = root / "config.json"
    if not config_path.exists():
        raise SystemExit("config.json not found")

    ai_config_path = root / "ai_config.json"
    if not ai_config_path.exists():
        raise SystemExit("ai_config.json not found")

    config = json.loads(_read_text(config_path))
    ai_config = json.loads(_read_text(ai_config_path))
    embedded = (
        "window.WAR_CONFIG = " + json.dumps(config, indent=2) + ";\n"
        + "window.WAR_AI_CONFIG = " + json.dumps(ai_config, indent=2) + ";\n"
    )

    if dist.exists():
        shutil.rmtree(dist)
    dist.mkdir(parents=True, exist_ok=True)

    # Copy static assets
    for name in ["style.css", "script.js", "chart.js"]:
        src = root / name
        if not src.exists():
            raise SystemExit(f"Missing required file: {name}")
        shutil.copy2(src, dist / name)

    # Write embedded config JS
    _write_text(dist / "config.embed.js", embedded)

    # Generate dist/index.html with embedded config loaded before script.js
    index_src = _read_text(root / "index.html")
    needle = '<script src="script.js"></script>'
    if needle not in index_src:
        raise SystemExit("index.html does not contain the expected script.js tag")

    index_dist = index_src.replace(
        needle,
        '<script src="config.embed.js"></script>\n\n    ' + needle,
        1,
    )
    _write_text(dist / "index.html", index_dist)

    # Also copy the raw configs for easy inspection (dist mode doesn't fetch them)
    shutil.copy2(config_path, dist / "config.json")
    shutil.copy2(ai_config_path, dist / "ai_config.json")

    print("Built dist/ (offline-ready):")
    print(f"- {dist / 'index.html'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
