"""Build the root index.html: one self-contained file with the CSS and JS from src/ inlined.

The result opens with a double-click (no local server needed) and is what GitHub Pages serves.
Edit the files in src/, then run:

    python tools/bundle.py             -> index.html
    python tools/bundle.py --fragment  -> dist/clockwork-butterfly.fragment.html (body only, for embedding)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
ORDER = ["themes.js", "butterfly.js", "telemetry.js", "main.js"]  # dependency order


def bundle_js() -> str:
    three_imports, body = [], []
    for name in ORDER:
        for line in (SRC / "js" / name).read_text(encoding="utf-8").splitlines():
            if re.match(r"\s*import .* from '\./", line):
                continue  # local module import: code is concatenated instead
            if re.match(r"\s*import .* from 'three", line):
                if line not in three_imports:
                    three_imports.append(line)
                continue
            body.append(re.sub(r"^export (const|function|class) ", r"\1 ", line))
    return "\n".join(three_imports + [""] + body)


def main() -> None:
    fragment = "--fragment" in sys.argv
    html = (SRC / "index.html").read_text(encoding="utf-8")
    css = (SRC / "css" / "style.css").read_text(encoding="utf-8")
    js = bundle_js()

    head = html.split("<!-- @head-start -->")[1].split("<!-- @head-end -->")[0]
    head = head.replace('<link rel="stylesheet" href="css/style.css">', f"<style>\n{css}</style>")
    body = html.split("<!-- @body-start -->")[1].split("<!-- @body-end -->")[0]
    body = body.replace('<script type="module" src="js/main.js"></script>', f'<script type="module">\n{js}\n</script>')

    if fragment:
        title = re.search(r"<title>.*?</title>", html).group(0)
        out = f"{title}\n{head.strip()}\n{body.strip()}\n"
        # the fragment host owns <html>; set the starting mode from script instead
        out = out.replace("<script type=\"module\">", "<script>document.documentElement.dataset.mode='porcelain'</script>\n<script type=\"module\">", 1)
        target = ROOT / "dist" / "clockwork-butterfly.fragment.html"
    else:
        banner = "<!-- Generated from src/ by tools/bundle.py. Edit the files in src/, then rebuild. -->\n"
        top = html.split("<!-- @head-start -->")[0].replace("<!doctype html>\n", "<!doctype html>\n" + banner, 1)
        out = top + head.strip() + "\n</head>\n<body>\n" + body.strip() + "\n</body>\n</html>\n"
        target = ROOT / "index.html"
    target.parent.mkdir(exist_ok=True)
    target.write_text(out, encoding="utf-8")
    print(f"wrote {target.relative_to(ROOT)} ({len(out) // 1024} KB)")


if __name__ == "__main__":
    main()
