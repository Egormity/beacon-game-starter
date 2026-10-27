#!/usr/bin/env python3
"""Start Beacon locally and open it in its own browser window."""

import argparse
import errno
import fcntl
from http.client import HTTPException
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, build_opener

from serve import APP_ID, DEFAULT_PORT, DEFAULT_ROOT

URL = f"http://127.0.0.1:{DEFAULT_PORT}"
SCRIPT_ROOT = Path(__file__).resolve().parent


def cache_directory() -> Path:
    configured = Path(os.environ.get("XDG_CACHE_HOME", "~/.cache")).expanduser()
    if not configured.is_absolute():
        configured = Path.home() / ".cache"
    directory = configured / APP_ID
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    return directory


def check_server(url: str = URL):
    """Return this app's identity, None if closed, or reject occupied ports."""
    try:
        # This check always stays on this computer, regardless of proxy settings.
        with build_opener(ProxyHandler({})).open(f"{url}/__beacon_health__", timeout=0.6) as response:
            identity = json.loads(response.read(4096))
        if (not isinstance(identity, dict)
                or identity.get("appId") != APP_ID
                or identity.get("root") != str(DEFAULT_ROOT.resolve())):
            raise ValueError("Another application answered the health check")
        return identity
    except HTTPError as error:
        raise RuntimeError(f"Port {DEFAULT_PORT} is occupied by another application. Close it before opening Beacon.") from error
    except URLError as error:
        if isinstance(error.reason, OSError) and error.reason.errno == errno.ECONNREFUSED:
            return None
        raise RuntimeError(f"Port {DEFAULT_PORT} is unavailable or is not responding. Close the application using it and try again.") from error
    except (ValueError, TimeoutError, OSError, HTTPException) as error:
        raise RuntimeError(f"Port {DEFAULT_PORT} is occupied by another application. Close it before opening Beacon.") from error


def start_server(cache: Path):
    if not (DEFAULT_ROOT / "index.html").is_file():
        raise RuntimeError(f"The app has not been built. Open {DEFAULT_ROOT.parent} and run pnpm build.")
    identity = check_server()
    if identity:
        return

    log_path = cache / "server.log"
    # A fresh log replaces the previous startup; HTTP requests are not logged.
    with log_path.open("w") as log:
        process = subprocess.Popen(
            [sys.executable, str(SCRIPT_ROOT / "serve.py")],
            stdin=subprocess.DEVNULL, stdout=log, stderr=log,
            cwd=DEFAULT_ROOT.parent, start_new_session=True,
        )
    (cache / "server.pid").write_text(str(process.pid), encoding="utf-8")
    for _ in range(50):
        if process.poll() is not None:
            details = log_path.read_text(encoding="utf-8")[-2000:].strip()
            raise RuntimeError(f"The local server could not start. {details}")
        if check_server():
            return
        time.sleep(0.1)
    process.terminate()
    raise RuntimeError(f"The local server did not start. See {log_path}.")


def stop_server(cache: Path):
    identity = check_server()
    if not identity:
        print("Beacon is already stopped.")
        return
    try:
        pid = int((cache / "server.pid").read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise RuntimeError("This server was started separately. Stop it in its terminal.") from error
    if identity.get("processId") != pid:
        raise RuntimeError("The running server does not match this launcher's saved process. Stop it in its terminal.")
    os.kill(pid, signal.SIGTERM)
    (cache / "server.pid").unlink(missing_ok=True)
    print("Beacon's local server has stopped.")


def open_window():
    for executable in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        browser = shutil.which(executable)
        if browser:
            subprocess.Popen([browser, f"--app={URL}", "--new-window"],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             start_new_session=True)
            return
    opener = shutil.which("xdg-open")
    if opener:
        subprocess.Popen([opener, URL], stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL, start_new_session=True)
        return
    raise RuntimeError(f"No browser launcher was found. Open {URL} in a browser.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--no-open", action="store_true", help="Start the server without opening a browser")
    mode.add_argument("--stop", action="store_true", help="Stop the local server started by this launcher")
    args = parser.parse_args()
    try:
        cache = cache_directory()
        with (cache / "launcher.lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            if args.stop:
                stop_server(cache)
                return
            start_server(cache)
        if not args.no_open:
            open_window()
        print(URL)
    except (RuntimeError, OSError) as error:
        message = str(error)
        print(f"Beacon: {message}", file=sys.stderr)
        dialog = shutil.which("zenity") if not (args.no_open or args.stop) else None
        if dialog:
            subprocess.run([dialog, "--error", "--title=Beacon", f"--text={message}"], check=False)
        sys.exit(1)


if __name__ == "__main__":
    main()
