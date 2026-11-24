"""Draw the art for site/card/img. Only needed after changing src/art.js or src/render.html."""
import functools
import http.server
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "site", "card", "img")

HAIR = {"blonde": "#e8c15a", "red": "#c4572e", "brown": "#8a5a36", "black": "#2b1b12"}
SKIN = {"light": "#f6cba9", "tan": "#dba177", "brown": "#a86b45", "dark": "#7a4a2e"}

WORLD = (900, 700)
# output name: (layer, width, height, device scale, crop box in card units or None, settings)
JOBS = {
    "uni": ("uni", *WORLD, 3, (-4, 394, 184, 572), {}),
    "envbg": ("envbg", *WORLD, 2, None, {}),
    "cakebg": ("cakebg", *WORLD, 2, None, {}),
    "envback": ("envback", 260, 220, 3, None, {}),
    "envfront": ("envfront", 260, 220, 3, None, {}),
    "envflap": ("envflap", 260, 220, 3, None, {}),
    "seal": ("seal", 260, 220, 3, None, {}),
    "fleck": ("fleck", 200, 200, 2, None, {}),
    "preview": ("og", 1200, 630, 1, None, {}),
}
for cross in (False, True):
    tail = "-cross" if cross else ""
    for layer in ("scenebg", "endbg", "lines"):
        JOBS[layer + tail] = (layer, *WORLD, 2.5, None, {"cross": cross})
    for hair in HAIR:
        for skin in SKIN:
            JOBS[f"prin-{hair}-{skin}{tail}"] = (
                "prin", *WORLD, 3, (164, 384, 290, 568), {"cross": cross, "hair": HAIR[hair], "skin": SKIN[skin]})

cfg = {}


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

    def do_GET(self):
        if self.path != "/config.json":
            return super().do_GET()
        body = json.dumps(cfg).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


os.makedirs(IMG, exist_ok=True)
chrome = find_chrome()
server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0), functools.partial(Quiet, directory=os.path.join(ROOT, "src")))
threading.Thread(target=server.serve_forever, daemon=True).start()
with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
    for name, (layer, w, h, k, crop, extra) in JOBS.items():
        cfg = {"name": "", "cross": False, "hair": HAIR["brown"], "skin": SKIN["light"], **extra}
        shot = os.path.join(tmp, name + ".png")
        # Headless Chrome keeps part of the window for its frame, so ask for a taller one and crop
        subprocess.run(
            [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
             f"--user-data-dir={os.path.join(tmp, 'profile')}",
             "--default-background-color=00000000", f"--force-device-scale-factor={k}",
             f"--window-size={max(w, 600)},{h + 200}", "--virtual-time-budget=8000",
             f"--screenshot={shot}", f"http://127.0.0.1:{server.server_port}/render.html?l={layer}"],
            check=True, capture_output=True, timeout=120)
        im = Image.open(shot).convert("RGBA").crop((0, 0, int(w * k), int(h * k)))
        if not im.getbbox():
            sys.exit(f"{name} came out blank")
        if crop:
            x0, y0, x1, y1 = crop
            im = im.crop(tuple(int(v * k) for v in (x0 + 300, y0 + 50, x1 + 300, y1 + 50)))
        if name == "preview":
            im.convert("RGB").save(os.path.join(IMG, "preview.jpg"), quality=88)
        else:
            im.save(os.path.join(IMG, name + ".webp"), quality=82, method=6)
        print("drew", name, flush=True)
server.shutdown()
