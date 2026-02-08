## talquen
A podman/docker install of BotBrowser with a Playwright client.

This project has a submodule [**hybrid**](HYBRID.md): a simple http client for requesting the source or DOM of a URL using an instance of talquen.

To deploy checkout this project from github and 	`npm run deploy`

```javascript
import talquen from 'talquen'
const browser = await talquen.wait();
```
### methods


+ **launch** `({ server, proxy, cookies , fingerprinting })` launch a browser instance, returns a Promise. <br/>
If there is a slot available the browser is initialized and the Promise resolves when it's ready, otherwise it rejects immediately. 
+ **wait** `({ server, proxy, cookies, fingerprinting })` also launches a browser instance and returns a Promise.<br/>
If the slot isn't available it waits until the next slot becomes available and resolves when the browser is ready.

### method parameters
+ **server**: the location of the backend container (default is `localhost`)
+ **proxy**: the proxy to use for the browser context. http/s or socks4/5, example: `socks5://with:auth@server:port`
+ **cookies**:  cookies for this browser context.
+ **fingerprinting**: if you want to customize the fingerprint for your instance.

There is a convenience method available that allows you to use a random fingerprint for each new instance:

```javascript
import talquen from 'talquen'
const browser = await talquen.wait({ fingerprinting: talquen.randomize() });
```

***
### Fingerprinting
This class configures the fingerprinting and other options of the browser instance you want to create. This functionality will be expanded in future versions to support a wide range of options provided by BotBrowser.
```javascript
import { wait, Fingerprinting } from 'talquen'
const fingerprinting = new Fingerprinting();
fingerprinting.platform("win");
fingerprinting.resolution(1440);

const browser = await talquen.wait({ fingerprinting });
```
+ **platform**:  select the platform: ***win, mac, android***
+ **brand**: allows you to mimic a specific branded browser, valid values are: ***chrome, chromium, brave, edge***
+ **resolution** (width, depth): sets the screen dimensions based on the platform and the width (and optional depth) specified.
    - *width* can be one of: ***3840, 1920, 1680, 1600, 1440, 1280, 1024, 800***
    - *depth* can be*** 8, 16 or 24***
+ **darkScheme**: will set the browser to use dark scheme.
+ **injectRandomHistory**: whether to inject random history for fingerprinting.
+ **disableDebugger**: disable debugger for fingerprinting
***
Like  `toltha` (a thin undici wrapper) this library is named using Tolkien's elven language:
***[talquen](https://www.elfdict.com/w/foot-soldier?include_old=1&natural_language=0)*** means "foot-soldier" 