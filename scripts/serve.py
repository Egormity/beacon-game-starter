#!/usr/bin/env python3
"""Serve the built Beacon app on this computer only."""

import argparse
import json
import mimetypes
import os
import sys
import traceback
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from http_range import parse_range

APP_ID = "beacon-game-starter"
DEFAULT_PORT = 4421
DEFAULT_ROOT = Path(__file__).resolve().parents[1] / "dist"


class StaticHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, root: Path, **kwargs):
        self.root = root.resolve()
        super().__init__(*args, directory=str(self.root), **kwargs)

    def log_message(self, _format, *args):
        # The launcher is long-lived; request logs must not fill the disk.
        pass

    def send_head(self):
        self.remaining_bytes = None
        try:
            path = unquote(urlsplit(self.path).path, errors="strict")
        except (ValueError, UnicodeError):
            self.send_error(400, "Invalid request path")
            return None

        if path == "/__beacon_health__":
            payload = json.dumps({
                "appId": APP_ID,
                "processId": os.getpid(),
                "root": str(self.root),
            }).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(payload)
            return None

        if "\x00" in path or "\\" in path or ".." in path.split("/"):
            self.send_error(403, "Path is outside the application")
            return None

        try:
            target = (self.root / path.lstrip("/")).resolve()
            if target.is_dir():
                target = (target / "index.html").resolve()
            target.relative_to(self.root)
        except (ValueError, OSError, RuntimeError):
            self.send_error(403, "Path is outside the application")
            return None

        try:
            if not target.is_file():
                self.send_error(404, "File not found")
                return None
            stream = target.open("rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        size = os.fstat(stream.fileno()).st_size
        byte_range = self.headers.get("Range") if not self.headers.get("If-Range") else None
        if byte_range:
            try:
                start, end = parse_range(byte_range, size)
            except ValueError:
                stream.close()
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{size}")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return None
            stream.seek(start)
            self.remaining_bytes = end - start + 1
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        else:
            self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(target)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(self.remaining_bytes if byte_range else size))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        return stream

    def copyfile(self, source, outputfile):
        if self.remaining_bytes is None:
            return super().copyfile(source, outputfile)
        remaining = self.remaining_bytes
        while remaining > 0:
            data = source.read(min(65536, remaining))
            if not data:
                break
            outputfile.write(data)
            remaining -= len(data)


class LocalStaticServer(ThreadingHTTPServer):
    daemon_threads = True
    error_reported = False

    def handle_error(self, _request, _client_address):
        if isinstance(sys.exc_info()[1], (BrokenPipeError, ConnectionResetError)):
            return
        if not self.error_reported:
            self.error_reported = True
            # Keep detached-server logs bounded even if a client repeats an error.
            print(traceback.format_exc()[-4096:], file=sys.stderr, flush=True)


def make_server(root: Path, port: int) -> ThreadingHTTPServer:
    handler = partial(StaticHandler, root=root)
    return LocalStaticServer(("127.0.0.1", port), handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    args = parser.parse_args()
    if not (args.root / "index.html").is_file():
        parser.error(f"No built app at {args.root}. Run pnpm build first.")
    if not 1 <= args.port <= 65535:
        parser.error("Port must be between 1 and 65535.")
    try:
        with make_server(args.root, args.port) as server:
            print(f"Beacon: http://127.0.0.1:{args.port}", flush=True)
            server.serve_forever()
    except OSError as error:
        parser.exit(1, f"Could not start Beacon: {error}\n")
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
