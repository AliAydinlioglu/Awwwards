import json
import subprocess
import time
import urllib.request
import base64

# Start Chrome in headless mode with remote debugging
chrome_proc = subprocess.Popen([
    "./scrollcraft/.browsers/chromium-1248/chrome-linux64/chrome",
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--user-data-dir=/tmp/cprofile_cdp",
    "--remote-debugging-port=9222",
    "--window-size=1440,900",
    "http://localhost:8080/sites/aurelia/"
])

time.sleep(2)

try:
    # Get WebSocket debugger URL
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    pages = json.loads(resp.read().decode())
    target_page = None
    for p in pages:
        if p.get("type") == "page":
            target_page = p
            break

    if not target_page:
        print("No target page found")
        exit(1)

    page_id = target_page["id"]
    print(f"Target page: {target_page['title']} (id: {page_id})")

finally:
    chrome_proc.terminate()
