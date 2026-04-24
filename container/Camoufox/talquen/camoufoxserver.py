#!/usr/bin/env python3
"""
Helper methods to launch and kill launcher.py as a subprocess.
"""

import os
import signal
import subprocess
import sys
from typing import Optional


def launch(params: dict, script_path: str = "launcher.py") -> int:
    """
    Launch launcher.py with the given parameters.

    Args:
        params:      Dict of parameters matching the CLI flags of launcher.py.
                     Keys use underscores, e.g. {"port": 1234, "ws_path": "mypath"}.
                     Boolean flags (block_images, etc.) should be True to enable.
                     Proxy should be a dict: {"server": "...", "username": "...", "password": "..."}.
        script_path: Path to launcher.py (default: same directory as this file).

    Returns:
        PID of the launched subprocess.

    Example:
        pid = launch_launcher({
            "port": 1234,
            "ws_path": "mypath",
            "proxy_server": "socks5://host:port",
            "proxy_username": "user",
            "proxy_password": "pass",
            "os": "windows",
            "headless": "true",
            "geoip": "true",
            "block_webrtc": True,
        })
    """
    # Map of param key -> CLI flag
    # Bool flags are stored separately (action="store_true")
    BOOL_FLAGS = {
        "enable_cache",
        "main_world_eval",
        "persistent_context",
        "block_images",
        "block_webrtc",
        "block_webgl",
        "disable_coop",
    }

    KEY_TO_FLAG = {
        "port":               "--port",
        "ws_path":            "--ws-path",
        "proxy_server":       "--proxy-server",
        "proxy_username":     "--proxy-username",
        "proxy_password":     "--proxy-password",
        "os":                 "--os",
        "fonts":              "--fonts",
        "screen":             "--screen",
        "webgl_vendor":       "--webgl-vendor",
        "webgl_renderer":     "--webgl-renderer",
        "config":             "--config",
        "headless":           "--headless",
        "humanize":           "--humanize",
        "addons":             "--addons",
        "window":             "--window",
        "enable_cache":       "--enable-cache",
        "main_world_eval":    "--main-world-eval",
        "persistent_context": "--persistent-context",
        "user_data_dir":      "--user-data-dir",
        "geoip":              "--geoip",
        "locale":             "--locale",
        "block_images":       "--block-images",
        "block_webrtc":       "--block-webrtc",
        "block_webgl":        "--block-webgl",
        "disable_coop":       "--disable-coop",
    }

    cmd = [sys.executable, script_path]

    for key, value in params.items():
        flag = KEY_TO_FLAG.get(key)
        if flag is None:
            raise ValueError(f"Unknown parameter: '{key}'")

        if key in BOOL_FLAGS:
            if value:
                cmd.append(flag)
        else:
            # Lists/dicts get serialised to the format launcher.py expects
            if isinstance(value, list):
                cmd.extend([flag, ",".join(str(v) for v in value)])
            elif isinstance(value, dict):
                # Only 'config' param takes a dict (JSON)
                import json
                cmd.extend([flag, json.dumps(value)])
            else:
                cmd.extend([flag, str(value)])

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    print(f"[camoufox_manager] Launched launcher.py with PID {process.pid}")
    print(f"[camoufox_manager] Command: {' '.join(cmd)}")
    return process.pid


def kill(pid: int, force: bool = False) -> bool:
    """
    Kill a launcher.py process by PID.

    Sends SIGTERM first (allows graceful child cleanup), then optionally SIGKILL.
    Also attempts to kill any child processes via psutil if available.

    Args:
        pid:   PID returned by launch_launcher().
        force: If True, send SIGKILL instead of SIGTERM (no graceful cleanup).

    Returns:
        True if the process was found and signalled, False if it was already gone.
    """
    sig = signal.SIGKILL if force else signal.SIGTERM

    # Try to kill children first via psutil
    try:
        import psutil
        try:
            parent = psutil.Process(pid)
            children = parent.children(recursive=True)
            for child in children:
                try:
                    child.send_signal(sig)
                    print(f"[camoufox_manager] Sent {sig.name} to child PID {child.pid} ({child.name()})")
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
        except psutil.NoSuchProcess:
            pass
    except ImportError:
        pass  # psutil not available, fall through to killing parent only

    # Kill the main process
    try:
        os.kill(pid, sig)
        print(f"[camoufox_manager] Sent {sig.name} to PID {pid}")
        return True
    except ProcessLookupError:
        print(f"[camoufox_manager] PID {pid} not found — already exited?")
        return False
    except PermissionError:
        print(f"[camoufox_manager] Permission denied killing PID {pid}")
        return False


# ── Example usage ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import time

    pid = launch_launcher({
        "port": 1234,
        "ws_path": "mypath",
        "headless": "true",
        "os": "windows",
        "block_webrtc": True,
    })

    print(f"Server running with PID {pid}, sleeping 5s...")
    time.sleep(5)

    kill_launcher(pid)
    print("Done.")