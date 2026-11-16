#!/usr/bin/env python3
"""A recording reverse proxy for the iOS launch smoke test (scripts/ios-launch-smoke.sh).

The simulator app talks to Jellyfin THROUGH this proxy, so the smoke test can see
exactly what the app's web layer did after launch — something nothing else can:
WKWebView content is invisible to the accessibility tree, and Jellyfin does not log
individual requests. Every request becomes one JSON line in the log:

  {"t": <epoch>, "method": "GET", "path": "/Users/<id>/Items/Latest", "status": 200,
   "device": "<DeviceId from the Authorization header>", "ids": ["<item ids in a JSON reply>"]}

Query strings are dropped from the log (they carry the ApiKey). Stdlib only.

  ios-smoke-proxy.py <listen-port> <upstream-base-url> <log-file>
"""
import http.client
import json
import re
import sys
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-length",
}
DEVICE_RE = re.compile(r'DeviceId="([^"]*)"')


def item_ids(body):
    """Item ids in a Jellyfin JSON reply: a bare array or an {Items: [...]} envelope."""
    try:
        data = json.loads(body)
    except ValueError:
        return []
    items = data.get("Items", []) if isinstance(data, dict) else data
    if not isinstance(items, list):
        return []
    return [i["Id"] for i in items if isinstance(i, dict) and isinstance(i.get("Id"), str)]


def make_handler(upstream, log):
    up = urllib.parse.urlsplit(upstream)

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *_):  # the JSON log below is the only output
            pass

        def proxy(self):
            length = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(length) if length else None
            # No Accept-Encoding upstream: an uncompressed reply is what lets record()
            # read the item ids out of it (WKWebView asks for gzip).
            drop = HOP_BY_HOP | {"host", "accept-encoding"}
            headers = {k: v for k, v in self.headers.items() if k.lower() not in drop}
            conn = http.client.HTTPConnection(up.hostname, up.port, timeout=60)
            try:
                conn.request(self.command, self.path, body=body, headers=headers)
                resp = conn.getresponse()
                data = resp.read()
            except OSError as e:
                self.send_error(502, f"upstream: {e}")
                self.record(502, b"")
                return
            finally:
                conn.close()
            self.send_response(resp.status, resp.reason)
            for k, v in resp.getheaders():
                if k.lower() not in HOP_BY_HOP:
                    self.send_header(k, v)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(data)
            ctype = resp.getheader("Content-Type") or ""
            self.record(resp.status, data if "json" in ctype else b"")

        def record(self, status, json_body):
            auth = self.headers.get("Authorization") or self.headers.get("X-Emby-Authorization") or ""
            m = DEVICE_RE.search(auth)
            entry = {
                "t": round(time.time(), 3),
                "method": self.command,
                "path": urllib.parse.urlsplit(self.path).path,
                "status": status,
                "device": m.group(1) if m else "",
                "ids": item_ids(json_body) if json_body else [],
            }
            with open(log, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")

        do_GET = do_POST = do_PUT = do_DELETE = do_HEAD = do_OPTIONS = do_PATCH = proxy

    return Handler


def main():
    port, upstream, log = int(sys.argv[1]), sys.argv[2], sys.argv[3]
    open(log, "w").close()
    ThreadingHTTPServer(("127.0.0.1", port), make_handler(upstream, log)).serve_forever()


if __name__ == "__main__":
    main()
