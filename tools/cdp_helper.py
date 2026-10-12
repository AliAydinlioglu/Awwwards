import json
import socket
import base64
import os
import subprocess
import time
import urllib.request
import urllib.parse

def send_ws_frame(s, text):
    payload = text.encode('utf-8')
    length = len(payload)
    # Client to server frames must be masked
    mask = os.urandom(4)
    if length <= 125:
        header = bytes([0x81, 0x80 | length]) + mask
    elif length <= 65535:
        header = bytes([0x81, 0x80 | 126, (length >> 8) & 0xff, length & 0xff]) + mask
    else:
        header = bytes([0x81, 0x80 | 127]) + length.to_bytes(8, 'big') + mask
    
    masked_payload = bytearray(length)
    for i in range(length):
        masked_payload[i] = payload[i] ^ mask[i % 4]
    s.sendall(header + masked_payload)

def recv_ws_frame(s):
    # Read first 2 bytes
    head = s.recv(2)
    if len(head) < 2:
        return None
    b1, b2 = head[0], head[1]
    is_masked = (b2 & 0x80) != 0
    length = b2 & 0x7f
    if length == 126:
        length = int.from_bytes(s.recv(2), 'big')
    elif length == 127:
        length = int.from_bytes(s.recv(8), 'big')
    
    mask = s.recv(4) if is_masked else None
    data = bytearray()
    while len(data) < length:
        chunk = s.recv(min(4096, length - len(data)))
        if not chunk:
            break
        data.extend(chunk)
    
    if is_masked:
        for i in range(len(data)):
            data[i] ^= mask[i % 4]
    return data.decode('utf-8', errors='ignore')

def run_tests():
    chrome = subprocess.Popen([
        "./scrollcraft/.browsers/chromium-1248/chrome-linux64/chrome",
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--user-data-dir=/tmp/cprofile_cdp2",
        "--remote-debugging-port=9222",
        "--window-size=1440,900",
        "http://localhost:8080/sites/aurelia/"
    ])
    time.sleep(2)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        pages = json.loads(req.read().decode())
        page = next(p for p in pages if p.get('type') == 'page')
        ws_url = page['webSocketDebuggerUrl']
        parsed = urllib.parse.urlparse(ws_url)
        
        # Connect socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((parsed.hostname, parsed.port))
        
        # Handshake
        key = base64.b64encode(os.urandom(16)).decode('ascii')
        handshake = (
            f"GET {parsed.path} HTTP/1.1\r\n"
            f"Host: {parsed.netloc}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        s.sendall(handshake.encode('ascii'))
        resp = s.recv(4096)
        if b"101" not in resp:
            print("WebSocket handshake failed:", resp)
            return

        print("CDP WebSocket Connected!")

        def cdp_call(method, params=None, msg_id=1):
            msg = {"id": msg_id, "method": method, "params": params or {}}
            send_ws_frame(s, json.dumps(msg))
            while True:
                f = recv_ws_frame(s)
                if not f:
                    return None
                try:
                    data = json.loads(f)
                    if data.get('id') == msg_id:
                        return data.get('result')
                except json.JSONDecodeError:
                    continue

        # Explicitly set desktop viewport metrics 1440x900
        cdp_call("Emulation.setDeviceMetricsOverride", {
            "width": 1440,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        }, msg_id=5)

        # Test positions
        scroll_tests = [
            ("act1", 100),
            ("act2", 1200),
            ("act3", 2100),
            ("act4", 2900),
            ("manifesto", 4200),
            ("works", 5400),
            ("pillars", 6800),
            ("commission", 8000),
        ]

        for idx, (label, scroll_y) in enumerate(scroll_tests, start=10):
            print(f"Scrolling to {scroll_y}px ({label})...")
            cdp_call("Runtime.evaluate", {
                "expression": f"window.scrollTo(0, {scroll_y});"
            }, msg_id=idx*10)
            time.sleep(0.8) # Allow lerp and render

            res = cdp_call("Page.captureScreenshot", {"format": "jpeg", "quality": 85}, msg_id=idx*10+1)
            if res and 'data' in res:
                img_data = base64.b64decode(res['data'])
                out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sites', 'aurelia', 'previews')
                os.makedirs(out_dir, exist_ok=True)
                fn = os.path.join(out_dir, f"preview_{label}.jpg")
                with open(fn, "wb") as f:
                    f.write(img_data)
                print(f"Saved {os.path.basename(fn)} ({len(img_data)} bytes)")

        # Test mobile viewport 390x844
        print("Testing mobile viewport 390x844...")
        cdp_call("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        }, msg_id=900)
        cdp_call("Runtime.evaluate", {"expression": "window.scrollTo(0, 0);"}, msg_id=901)
        time.sleep(0.5)
        res_m1 = cdp_call("Page.captureScreenshot", {"format": "jpeg", "quality": 85}, msg_id=902)
        if res_m1 and 'data' in res_m1:
            fn_m1 = os.path.join(out_dir, "preview_mobile_hero.jpg")
            with open(fn_m1, "wb") as f:
                f.write(base64.b64decode(res_m1['data']))
            print("Saved preview_mobile_hero.jpg")

        cdp_call("Runtime.evaluate", {"expression": "window.scrollTo(0, 5200);"}, msg_id=903)
        time.sleep(0.5)
        res_m2 = cdp_call("Page.captureScreenshot", {"format": "jpeg", "quality": 85}, msg_id=904)
        if res_m2 and 'data' in res_m2:
            fn_m2 = os.path.join(out_dir, "preview_mobile_works.jpg")
            with open(fn_m2, "wb") as f:
                f.write(base64.b64decode(res_m2['data']))
            print("Saved preview_mobile_works.jpg")

    finally:
        chrome.terminate()

if __name__ == "__main__":
    run_tests()
