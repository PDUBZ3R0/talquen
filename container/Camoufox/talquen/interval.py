 
import threading
import asyncio

def setInterval(function, seconds):
    class __interval__:
        def __init__(self, func, secs):
            self.cancelled = False
            self.func = func
            self.secs = secs

        def start(self):
            if not self.cancelled:
                t = threading.Timer(self.secs, self.check)
                t.start()

        def check(self):
            if not self.cancelled and self.func != None:
                asyncio.run(self.func())
                self.start()

        def cancel(self):
            self.cancelled = True
            self.func = None

    intv = __interval__(function, seconds)
    intv.start()
    return intv


def setTimeout(function, seconds):
    class __timeout__:
        def __init__(self, func, secs):
            self.cancelled = False
            self.func = func
            self.secs = secs

        def start(self):
            if not self.cancelled:
                t = threading.Timer(self.secs, self.check)
                t.start()

        def check(self):
            if not self.cancelled:
                asyncio.run(self.func())

        def cancel(self):
            self.cancelled = True

    timo = __timeout__(function, seconds)
    timo.start()
    return timo
