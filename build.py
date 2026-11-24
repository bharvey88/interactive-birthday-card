"""Build the card: draw the art with headless Chrome, then fill in the page. Output goes to dist/<slug>/."""
import functools
import html
import http.server
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading

from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(ROOT, "config.json"), encoding="utf-8"))
if not re.fullmatch(r"[a-z0-9-]+", CFG["slug"]):
    sys.exit("config.json: slug can only use lowercase letters, numbers and dashes")
if not 1 <= CFG["age"] <= 12:
    sys.exit("config.json: age has to be 1 to 12 so the candles fit on the cake")

OUT = os.path.join(ROOT, "dist", CFG["slug"])
IMG = os.path.join(OUT, "img")

# name: (width, height, device scale, crop box in card units or None)
LAYERS = {
    "scenebg": (900, 700, 2.5, None),
    "endbg": (900, 700, 2.5, None),
    "uni": (900, 700, 3, (-4, 394, 184, 572)),
    "prin": (900, 700, 3, (164, 384, 290, 568)),
    "lines": (900, 700, 2.5, None),
    "envbg": (900, 700, 2, None),
    "cakebg": (900, 700, 2, None),
    "envback": (260, 220, 3, None),
    "envfront": (260, 220, 3, None),
    "envflap": (260, 220, 3, None),
    "seal": (260, 220, 3, None),
    "fleck": (200, 200, 2, None),
    "og": (1200, 630, 1, None),
}


def find_chrome():
    paths = [
        os.environ.get("CHROME", ""),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    paths += [shutil.which(n) or "" for n in ("google-chrome", "chromium", "chromium-browser")]
    for p in paths:
        if p and os.path.exists(p):
            return p
    sys.exit("Chrome not found. Set the CHROME environment variable to its path.")


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def translate_path(self, path):
        if path.split("?")[0] == "/config.json":
            return os.path.join(ROOT, "config.json")
        return super().translate_path(path)


def draw():
    chrome = find_chrome()
    handler = functools.partial(Quiet, directory=os.path.join(ROOT, "src"))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        for name, (w, h, k, crop) in LAYERS.items():
            shot = os.path.join(tmp, name + ".png")
            # Headless Chrome keeps part of the window for its frame, so ask for a taller one and crop
            subprocess.run(
                [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                 f"--user-data-dir={os.path.join(tmp, 'profile')}",
                 "--default-background-color=00000000", f"--force-device-scale-factor={k}",
                 f"--window-size={max(w, 600)},{h + 200}", "--virtual-time-budget=8000",
                 f"--screenshot={shot}",
                 f"http://127.0.0.1:{server.server_port}/render.html?l={name}"],
                check=True, capture_output=True, timeout=120)
            im = Image.open(shot).convert("RGBA").crop((0, 0, int(w * k), int(h * k)))
            if not im.getbbox():
                sys.exit(f"{name} came out blank")
            if crop:
                x0, y0, x1, y1 = crop
                im = im.crop(tuple(int(v * k) for v in (x0 + 300, y0 + 50, x1 + 300, y1 + 50)))
            if name == "og":
                im.convert("RGB").save(os.path.join(IMG, "preview.jpg"), quality=88)
            else:
                im.save(os.path.join(IMG, name + ".webp"), quality=82, method=6)
            print("drew", name)
    server.shutdown()


def ordinal(n):
    return f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


def fill():
    for f in ("card.css", "card.js"):
        shutil.copy(os.path.join(ROOT, "src", "card", f), OUT)
    first, *rest = [html.escape(line) for line in CFG["message"]]
    message = f"<h2>{first}</h2>" + "".join(f"<p>{line}</p>" for line in rest)
    message += f'<p class="sig">Love, {html.escape(CFG["from"])}</p>'
    values = {
        "NAME": html.escape(CFG["name"]),
        "ORDINAL": ordinal(CFG["age"]),
        "TITLE_SIZE": str(round(min(66, 440 / (len(CFG["name"]) + 1)))),
        "MESSAGE": message,
        "BASE": f'{CFG["siteUrl"].rstrip("/")}/{CFG["slug"]}',
        "CFG_JSON": json.dumps({"age": CFG["age"], "syllables": CFG["syllables"]}).replace("<", "\\u003c"),
    }
    page = open(os.path.join(ROOT, "src", "card", "index.html"), encoding="utf-8").read()
    for key, value in values.items():
        page = page.replace("{{" + key + "}}", value)
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8", newline="\n").write(page)
    with open(os.path.join(ROOT, "dist", "_headers"), "w", newline="\n") as f:
        f.write("/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Referrer-Policy: no-referrer\n")


os.makedirs(IMG, exist_ok=True)
if "--no-art" not in sys.argv:
    draw()
fill()
print("built", os.path.join("dist", CFG["slug"]))
