#!/usr/bin/env python3
"""
Awwwards Creative Lab — Multi-Site Dev Server
Supports RFC 7233 byte-range streaming (HTTP 206) for 60fps video scrubbing.
Supports single-site focus mode (--site <name>) or multi-site showcase hub.
"""

import os
import re
import sys
import argparse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class RangeHTTPRequestHandler(SimpleHTTPRequestHandler):
    site_prefix = None

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def translate_path(self, path):
        # If running in dedicated site mode, prepend site directory
        if self.site_prefix:
            relpath = path.lstrip('/')
            return os.path.join(self.site_prefix, relpath)
        return super().translate_path(path)

    def do_GET(self):
        # In multi-site mode, provide friendly shortcuts:
        # e.g., /aurelia -> /sites/aurelia/
        if not self.site_prefix:
            clean_path = self.path.split('?')[0].rstrip('/')
            if clean_path in ('/aurelia', '/sites/aurelia'):
                if not self.path.endswith('/'):
                    self.send_response(301)
                    self.send_header('Location', '/sites/aurelia/')
                    self.end_headers()
                    return

            if self.path == '/' or self.path == '':
                self.path = '/index.html'

        # Check for HTTP Range header (crucial for video scrub seeking)
        range_header = self.headers.get('Range', None)
        if not range_header:
            return super().do_GET()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().do_GET()

        ctype = self.guess_type(path)
        try:
            file_size = os.path.getsize(path)
        except OSError:
            return super().do_GET()

        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not range_match:
            return super().do_GET()

        first_byte, last_byte = range_match.groups()
        first_byte = int(first_byte)
        if last_byte:
            last_byte = min(int(last_byte), file_size - 1)
        else:
            last_byte = file_size - 1

        length = last_byte - first_byte + 1

        try:
            f = open(path, 'rb')
            f.seek(first_byte)
        except OSError:
            self.send_error(404, "File not found")
            return

        self.send_response(206)
        self.send_header('Content-type', ctype)
        self.send_header('Content-Range', f'bytes {first_byte}-{last_byte}/{file_size}')
        self.send_header('Content-Length', str(length))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()

        # Stream chunk
        chunk_size = 64 * 1024
        remaining = length
        while remaining > 0:
            to_read = min(chunk_size, remaining)
            data = f.read(to_read)
            if not data:
                break
            try:
                self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                break
            remaining -= len(data)
        f.close()

def main():
    parser = argparse.ArgumentParser(description="Awwwards Creative Lab Server")
    parser.add_argument('--port', type=int, default=8080, help="Port to serve on (default: 8080)")
    parser.add_argument('--site', type=str, default=None, help="Specific site to mount at root (e.g., 'aurelia')")
    args = parser.parse_args()

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if os.path.basename(os.path.abspath('.')) == 'Awwwards':
        repo_root = os.path.abspath('.')

    os.chdir(repo_root)

    handler_class = RangeHTTPRequestHandler
    if args.site:
        site_path = os.path.join(repo_root, 'sites', args.site)
        if not os.path.isdir(site_path):
            print(f"Error: Site '{args.site}' not found in {site_path}")
            sys.exit(1)
        handler_class.site_prefix = site_path
        print(f"🌟 Serving dedicated site: sites/{args.site} directly at http://localhost:{args.port}/")
    else:
        handler_class.site_prefix = None
        print(f"✨ Awwwards Creative Lab running on http://localhost:{args.port}/")
        print(f"   • Master Showcase:  http://localhost:{args.port}/")
        print(f"   • Atelier Aurelia:  http://localhost:{args.port}/sites/aurelia/")
        print(f"   • Starter Template: http://localhost:{args.port}/sites/_template/")

    server_address = ('0.0.0.0', args.port)
    httpd = ThreadingHTTPServer(server_address, handler_class)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    main()
