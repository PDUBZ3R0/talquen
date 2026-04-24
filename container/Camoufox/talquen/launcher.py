#!/usr/bin/env python3
"""
Camoufox remote server launcher.
Wraps launch_server() with full CLI argument support.
Handles SIGTERM/SIGINT/SIGHUP gracefully and kills child processes on exit.
"""

import argparse
import atexit
import json
import os
import signal
import sys
import threading

from camoufox.server import launch_server


# ── Signal / cleanup handling ─────────────────────────────────────────────────

_child_pids: list[int] = []


def _kill_children(sig_name: str) -> None:
    if not _child_pids:
        return
    print(f"\n[camoufox_server] {sig_name} — killing {len(_child_pids)} child process(es)...")
    for pid in _child_pids:
        try:
            os.kill(pid, signal.SIGTERM)
            print(f"  SIGTERM → PID {pid}")
        except ProcessLookupError:
            pass


def _signal_handler(signum, frame) -> None:
    _kill_children(signal.Signals(signum).name)
    sys.exit(0)


def _register_signals() -> None:
    for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        try:
            signal.signal(sig, _signal_handler)
        except OSError:
            pass


def _track_children() -> None:
    """Background thread: track child PIDs via psutil so they can be cleaned up."""
    import psutil
    current = psutil.Process(os.getpid())
    while True:
        try:
            for child in current.children(recursive=True):
                if child.pid not in _child_pids:
                    _child_pids.append(child.pid)
                    print(f"[camoufox_server] Tracking child PID {child.pid} ({child.name()})")
        except Exception:
            pass
        threading.Event().wait(2)


def _start_child_tracker() -> None:
    try:
        import psutil  # noqa: F401
        t = threading.Thread(target=_track_children, daemon=True)
        t.start()
        # atexit fires on normal exit too, so children are always cleaned up
        atexit.register(_kill_children, "atexit")
    except ImportError:
        print("[camoufox_server] Note: install 'psutil' for reliable child-process cleanup.")
        print("  pip install psutil\n")


# ── Argument parsing ──────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(
        description="Launch a Camoufox remote WebSocket server.",
        formatter_class=argparse.RawTextHelpFormatter,
    )

    # Server
    srv = parser.add_argument_group("Server")
    srv.add_argument("--port", type=int, default=None,
                     help="Port to listen on (default: random)")
    srv.add_argument("--ws-path", dest="ws_path", default=None,
                     help="WebSocket path, e.g. 'mypath' -> ws://host:<port>/mypath\n"
                          "(default: random)")

    # Proxy
    prx = parser.add_argument_group("Proxy")
    prx.add_argument("--proxy-server",   dest="proxy_server",   default=None,
                     help="Proxy URL, e.g. http://host:port or socks5://host:port")
    prx.add_argument("--proxy-username", dest="proxy_username", default=None,
                     help="Proxy username")
    prx.add_argument("--proxy-password", dest="proxy_password", default=None,
                     help="Proxy password")

    # Fingerprint
    fp = parser.add_argument_group("Fingerprint / Device")
    fp.add_argument("--os", dest="os", default=None,
                    help="OS: windows | macos | linux\n"
                         "Comma-separated to pick randomly, e.g. windows,macos")
    fp.add_argument("--fonts", dest="fonts", default=None,
                    help="Comma-separated extra font families, e.g. Arial,Helvetica")
    fp.add_argument("--screen", dest="screen", default=None,
                    help="Max screen size as WxH, e.g. 1920x1080")
    fp.add_argument("--webgl-vendor",   dest="webgl_vendor",   default=None,
                    help="WebGL vendor string (pair with --webgl-renderer)")
    fp.add_argument("--webgl-renderer", dest="webgl_renderer", default=None,
                    help="WebGL renderer string (pair with --webgl-vendor)")
    fp.add_argument("--config", dest="config", default=None,
                    help="Raw Camoufox config overrides as JSON, e.g. '{\"key\": \"val\"}'")

    # Behaviour
    beh = parser.add_argument_group("Behaviour")
    beh.add_argument("--headless", dest="headless", default=None,
                     choices=["true", "false", "virtual"],
                     help="Headless mode: true | false | virtual (Xvfb on Linux)\n"
                          "(default: true)")
    beh.add_argument("--humanize", dest="humanize", default=None,
                     help="Humanise cursor: 'true' or max seconds, e.g. 2.0")
    beh.add_argument("--addons", dest="addons", default=None,
                     help="Comma-separated paths to extracted Firefox addon folders")
    beh.add_argument("--window", dest="window", default=None,
                     help="Browser window size as WxH, e.g. 1280x720")
    beh.add_argument("--enable-cache",       dest="enable_cache",       action="store_true")
    beh.add_argument("--main-world-eval",    dest="main_world_eval",    action="store_true")
    beh.add_argument("--persistent-context", dest="persistent_context", action="store_true")
    beh.add_argument("--user-data-dir",      dest="user_data_dir",      default=None,
                     help="Profile directory path (used with --persistent-context)")

    # Location
    loc = parser.add_argument_group("Location / Language")
    loc.add_argument("--geoip",  dest="geoip",  default=None,
                     help="GeoIP: 'true' to auto-detect, or a specific IP, e.g. 203.0.113.0")
    loc.add_argument("--locale", dest="locale", default=None,
                     help="Locale(s), e.g. en-US or en-US,fr-FR")

    # Toggles
    tog = parser.add_argument_group("Toggles")
    tog.add_argument("--block-images",  dest="block_images",  action="store_true")
    tog.add_argument("--block-webrtc",  dest="block_webrtc",  action="store_true")
    tog.add_argument("--block-webgl",   dest="block_webgl",   action="store_true")
    tog.add_argument("--disable-coop",  dest="disable_coop",  action="store_true")

    return parser.parse_args()


# ── Build kwargs ──────────────────────────────────────────────────────────────

def build_kwargs(args):
    kwargs = {}

    if args.port is not None:
        kwargs["port"] = args.port
    if args.ws_path is not None:
        kwargs["ws_path"] = args.ws_path

    if args.proxy_server:
        proxy = {"server": args.proxy_server}
        if args.proxy_username:
            proxy["username"] = args.proxy_username
        if args.proxy_password:
            proxy["password"] = args.proxy_password
        kwargs["proxy"] = proxy

    if args.os:
        parts = [o.strip() for o in args.os.split(",")]
        kwargs["os"] = parts if len(parts) > 1 else parts[0]

    if args.fonts:
        kwargs["fonts"] = [f.strip() for f in args.fonts.split(",")]

    if args.screen:
        from browserforge.fingerprints import Screen
        w, h = args.screen.lower().split("x")
        kwargs["screen"] = Screen(max_width=int(w), max_height=int(h))

    if args.webgl_vendor and args.webgl_renderer:
        kwargs["webgl_config"] = (args.webgl_vendor, args.webgl_renderer)
    elif args.webgl_vendor or args.webgl_renderer:
        print("Warning: --webgl-vendor and --webgl-renderer must both be set. Ignoring.")

    if args.config:
        kwargs["config"] = json.loads(args.config)

    if args.headless is not None:
        kwargs["headless"] = {"true": True, "false": False, "virtual": "virtual"}[args.headless]
    else:
        kwargs["headless"] = True  # sensible server default

    if args.humanize is not None:
        kwargs["humanize"] = True if args.humanize.lower() == "true" else float(args.humanize)

    if args.addons:
        kwargs["addons"] = [a.strip() for a in args.addons.split(",")]

    if args.window:
        w, h = args.window.lower().split("x")
        kwargs["window"] = (int(w), int(h))

    if args.enable_cache:       kwargs["enable_cache"]       = True
    if args.main_world_eval:    kwargs["main_world_eval"]    = True
    if args.persistent_context: kwargs["persistent_context"] = True
    if args.user_data_dir:      kwargs["user_data_dir"]      = args.user_data_dir

    if args.geoip is not None:
        kwargs["geoip"] = True if args.geoip.lower() == "true" else args.geoip

    if args.locale:
        parts = [l.strip() for l in args.locale.split(",")]
        kwargs["locale"] = parts if len(parts) > 1 else parts[0]

    if args.block_images:  kwargs["block_images"] = True
    if args.block_webrtc:  kwargs["block_webrtc"] = True
    if args.block_webgl:   kwargs["block_webgl"]  = True
    if args.disable_coop:  kwargs["disable_coop"] = True

    return kwargs


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    _register_signals()
    _start_child_tracker()

    args = parse_args()
    kwargs = build_kwargs(args)

    port = kwargs.get("port", "<random>")
    path = kwargs.get("ws_path", "<random>")
    print(f"[camoufox_server] Starting on port={port}  ws_path={path}")
    if isinstance(port, int) and isinstance(path, str):
        print(f"[camoufox_server] WebSocket endpoint: ws://localhost:{port}/{path}")
    print("[camoufox_server] Send SIGTERM or Ctrl+C to stop cleanly.\n")

    try:
        launch_server(**kwargs)
    except KeyboardInterrupt:
        _kill_children("KeyboardInterrupt")
        sys.exit(0)


if __name__ == "__main__":
    main()