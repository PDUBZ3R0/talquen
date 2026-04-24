#!/usr/bin/env python

import asyncio
import websockets
import json
import time
import re
import os
import threading
import requests
import camoufoxserver

from uuid import uuid4
from enum import Enum
from psutil import cpu_percent, swap_memory, virtual_memory, process_iter, Process
from datetime import datetime
from interval import setTimeout, setInterval

IP = "0.0.0.0"
PORT = 42200
POOLSIZE = 20
MAX_IDLE_SECONDS = 5 * 60
MAX_WAIT_SECONDS = 5 * 60
MAX_LAUNCH_SECONDS = 2 * 60
PERFMON_SECONDS = 5 * 60

SQS = "{"
SQE = "}"

class Status(Enum):
    Idle = 1
    InUse = 2

pool = []
for i in range(POOLSIZE):
    pool.append({"status": Status.Idle})


def zerofill(num, digits=2):
    str = f"{num}"
    while len(str) < digits:
        str = f"0{str}"
    return str


def timestamp(date=None, delim=".", delim_datetime="|"):
    if (date == None):
        date = datetime.now()
    t = date
    d = delim
    d2 = delim_datetime
    return f"{t.year}{d}{zerofill(t.month)}{d}{zerofill(t.day)}{d2}{zerofill(t.hour)}{d}{zerofill(t.minute)}{d}{zerofill(t.second)}"


def log2(line, fn="@console", both=False):
    if both or fn == "@console":
        print(line)
    elif both or fn != "@console":
        try:
            log = open(fn, "a")
            log.write(line)
        except:
            pass


def nowish():
    return int(time.time() * 1000)


def openport():
    for i in range(POOLSIZE):
        if pool[i]["status"] == Status.Idle:
            return i
    return None

def find(port):
    try:
        response = requests.get(f"http://localhost:{port + PORT + 1}/", timeout=5)
        if ("Running" == response.text):
            return True
    except Exception as ex:
        log2(ex, "/var/log/talquen/error.log")
    return False

def idlecheck(port):
    async def checki():
        if pool[port]["status"] != Status.Idle:
            idle_timeout = pool[port]["since"] + (60 * 1000 * MAX_IDLE_SECONDS)

            if nowish() > idle_timeout:
                close(port)

    pool[port]["idlecheck"] = setInterval(checki, 15)


def close(port):
    pool[port]["idlecheck"].cancel()

    try:
        camoufoxserver.kill(pool[port]["pid"], True)
    finally:
        pool[port] = {"status": Status.Idle}


async def awaitlaunch(port, ws, pid, userdata):
    began = nowish()

    async def checkfunc():
        found = find(port)
        elapsed = nowish() - began

        if found:
            pool[port] = { 
                "status": Status.InUse,
                "since": nowish(),
                "tmp": userdata,
                "pid": pid
            }

            idlecheck(port)

            await ws.send(
                f'{SQS} "action": "launch", "success": true, "port": {PORT + port + 1} {SQE}'
            )

        elif elapsed < MAX_LAUNCH_SECONDS*1000:
            setTimeout(checkfunc, 2)

        else:
            camoufoxserver.kill(pid, True)
            await ws.send(
                f'{SQS} "action": "launch", "success": false, "error": "execution exceeded timeout: {MAX_LAUNCH_SECONDS}s" {SQE}'
            )
    
    setTimeout(checkfunc, 3)


def awaitthread(port, ws, pid, userdata):
    asyncio.run(awaitlaunch(port, ws, pid, userdata))


async def launch(ws, port, fingerprint):
    if (fingerprint["persistent_context"]):
        userdata = f"/tmp/{uuid4()}"
        fingerprint["user_data_dir"] = userdata

    fingerprint["headless"] = "virtual"
    fingerprint["geoip"] = "true"
    fingerprint["port"] = port + PORT + 1
    fingerprint["ws_path"] = "camoufox"

    try:
        pid = camoufoxserver.launch(fingerprint)
        print(f"launched camoufox, process: {pid}")
        thread = threading.Thread(target=awaitthread, kwargs={"port": port, "ws": ws, "pid": pid, "userdata": userdata }, daemon=True)
        thread.start()

    except Exception as error:
        await ws.send(
            f'{SQS} "action": "launch", "success": false, "error": "{error}" {SQE}'
        )
        log2(error, "/var/log/talquen/error.log")

async def servo(websocket):
    async for message in websocket:
        config = json.loads(message)

        log2(message, "/var/log/talquen/message.log", True)

        if config["action"] == "launch":
            slot = openport()
            if slot != None:
                await launch(websocket, slot, config["fingerprint"])
            else:
                await websocket.send(
                    f'{SQS} "action": "launch", "success": false, "error": "maximum instances ({POOLSIZE}) already in use." {SQE}'
                )

        elif config["action"] == "wait":
            began = nowish()

            async def handler():
                elapsed = nowish() - began
                slot = openport()
                if slot != None:
                    await launch(websocket, slot, config["fingerprint"])
                elif elapsed < MAX_WAIT_SECONDS:
                    setTimeout(handler, 5)
                else:
                    await websocket.send(
                        f'{SQS} "action": "launch", "success": false, "error": "wait exceeded timeout: {MAX_WAIT_SECONDS}s" {SQE}'
                    )
            await handler()

        elif config["action"] == "activity":
            if pool[config["port"] - PORT - 1]["status"] == Status.InUse:
                pool[config["port"] - PORT - 1]["since"] = nowish()

        elif config["action"] == "close":
            close(config["port"] - PORT - 1)
            await websocket.close()


async def perfmon():
    stats = {
        "vram": virtual_memory().percent,
        "cpu": {
            "usage": cpu_percent(interval=None),
            "threads": cpu_percent(interval=None, percpu=True),
        },
    }
    thpc = f"[ {stats["cpu"]["usage"]}% ]"
    for th in stats["cpu"]["threads"]:
        thpc = thpc + f"{th}]"
    
    statlog = f"[{timestamp()}] ram: [ {stats["vram"]} ]% - cpu: {thpc}"
    log2(statlog, "/var/log/talquen/usage.log", True)

async def main():
    intv = setInterval(perfmon, PERFMON_SECONDS)
    print(f"Websocket Server Listening on: {IP}:{PORT} for talquen client requests.")
    
    async with websockets.serve(servo, IP, PORT):
        try:
            await asyncio.Future()
        except:
            print("cancelled process")
        finally:
            intv.cancel()

if __name__ == "__main__":
    asyncio.run(main())