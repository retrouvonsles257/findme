#!/usr/bin/env python3
"""Fichiers sous src/ non atteignables depuis les points d'entrée (app + tests)."""
import os
import re
import sys

SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))

ALIASES = [
    ("@/", SRC + os.sep),
    ("@components/", os.path.join(SRC, "components") + os.sep),
    ("@features/", os.path.join(SRC, "features") + os.sep),
    ("@pages/", os.path.join(SRC, "pages") + os.sep),
    ("@services/", os.path.join(SRC, "services") + os.sep),
    ("@hooks/", os.path.join(SRC, "hooks") + os.sep),
    ("@utils/", os.path.join(SRC, "utils") + os.sep),
    ("@types/", os.path.join(SRC, "@types") + os.sep),
    ("@config/", os.path.join(SRC, "config") + os.sep),
    ("@contexts/", os.path.join(SRC, "contexts") + os.sep),
    ("@store/", os.path.join(SRC, "store") + os.sep),
    ("@assets/", os.path.join(SRC, "assets") + os.sep),
    ("@styles/", os.path.join(SRC, "styles") + os.sep),
]

ASSET_EXT = (
    ".ts",
    ".tsx",
    ".css",
    ".scss",
    ".json",
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".mjs",
)


def try_file(base_no_ext: str):
    base_no_ext = os.path.abspath(base_no_ext)
    if os.path.isfile(base_no_ext):
        return base_no_ext
    for ext in (".tsx", ".ts"):
        cand = base_no_ext + ext
        if os.path.isfile(cand):
            return cand
    for ext in ASSET_EXT:
        if ext in (".ts", ".tsx"):
            continue
        cand = base_no_ext + ext
        if os.path.isfile(cand):
            return cand
    if os.path.isdir(base_no_ext):
        for idx in ("index.tsx", "index.ts"):
            cand = os.path.join(base_no_ext, idx)
            if os.path.isfile(cand):
                return os.path.abspath(cand)
    return None


def resolve_import(from_file: str, spec: str):
    spec = spec.split("?")[0].strip()
    if not spec or spec.startswith("http"):
        return None
    if spec.startswith("."):
        base = os.path.normpath(os.path.join(os.path.dirname(from_file), spec))
        return try_file(base)
    for prefix, rep in ALIASES:
        if spec.startswith(prefix):
            rest = spec[len(prefix) :]
            base = os.path.normpath(os.path.join(rep, rest))
            return try_file(base)
    if not spec.startswith("@") and "/" in spec:
        base = os.path.normpath(os.path.join(SRC, spec))
        return try_file(base)
    return None


def collect_entries():
    entries = [
        os.path.join(SRC, "index.tsx"),
        os.path.join(SRC, "reportWebVitals.ts"),
        os.path.join(SRC, "setupTests.ts"),
    ]
    for dp, _, fs in os.walk(SRC):
        for f in fs:
            if f.endswith((".test.tsx", ".test.ts")):
                entries.append(os.path.join(dp, f))
    return [os.path.abspath(p) for p in entries if os.path.isfile(p)]


FROM_RE = re.compile(r"""from\s+['\"]([^'\"]+)['\"]""")
IMPORT_SIDE_RE = re.compile(r"""import\s+['\"]([^'\"]+)['\"]""")
DYN_IMPORT_RE = re.compile(r"""import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)""")


def scan_file(path: str):
    try:
        text = open(path, encoding="utf-8", errors="ignore").read()
    except OSError:
        return []
    out = []
    for rx in (FROM_RE, IMPORT_SIDE_RE, DYN_IMPORT_RE):
        out.extend(m.group(1) for m in rx.finditer(text))
    return out


def main():
    visited = set()
    stack = list(collect_entries())
    while stack:
        p = stack.pop()
        p = os.path.abspath(p)
        if p in visited:
            continue
        if not p.startswith(SRC):
            continue
        if not os.path.isfile(p):
            continue
        visited.add(p)
        if p.endswith((".ts", ".tsx")):
            for spec in scan_file(p):
                if any(spec.endswith(ext) for ext in (".css", ".scss", ".json", ".svg", ".png")) or "/" in spec or spec.startswith("."):
                    r = resolve_import(p, spec)
                    if r and r not in visited:
                        stack.append(r)

    tracked_ext = (
        ".ts",
        ".tsx",
        ".css",
        ".scss",
        ".json",
        ".svg",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".gif",
    )
    all_files = set()
    for dp, _, fs in os.walk(SRC):
        for f in fs:
            if not any(f.endswith(ext) for ext in tracked_ext):
                continue
            all_files.add(os.path.abspath(os.path.join(dp, f)))

    # Inclure react-app-env.d.ts comme racine optionnelle (référencé par TS, pas toujours importé)
    env_d = os.path.join(SRC, "react-app-env.d.ts")
    if os.path.isfile(env_d):
        visited.add(os.path.abspath(env_d))

    unreachable = sorted(all_files - visited)
    for p in unreachable:
        print(p)
    print(f"# TOTAL {len(all_files)} visited {len(visited)} unreachable {len(unreachable)}", file=sys.stderr)


if __name__ == "__main__":
    main()
