## talquen
A Playwright client for accessing a pool of available Camoufox Browser instances deployed as a Podman/Docker container, can be used locally or remotely.

This project has a submodule [**hybrid**](HYBRID.md): a simple http client for requesting the source or DOM of a URL using an instance of talquen,
for times when a pure http/s client like [**toltha**](/PDUBZ3R0/toltha/) isn't enough and you need a real stealth browser instance, but you only
need to load pages by their URLs and scrape them, for those cases where no interaction is necessary. Examples of this might be: needing to get past
a captcha or cloudflare turnstile that a browser bypasses automatically, need to scrape a page that renders immediately but only if its javascript 
is executed, etc... you get the idea. Setting up an interchangeable talquen/toltha fetch of data, with common logic to parse from the returned source
or access the data from the DOM (uses cheerio) is a simple and elegant solution for multiple sites needing basic scraping, with custom talquen modules
containing Playwright logic for interacting with the sites that require it.

To deploy checkout this project from github and 	`npm run deploy`

### Basic example:

```javascript
import talquen from 'talquen'
const browser = await talquen.wait();
const page = await browser.newPage();
```

### The difference between talquen's 2 methods:

+ **launch** `({ server, proxy, cookies, fingerprint })` launch a browser instance, returns a Promise. <br/>
If there is a slot available the browser is initialized and the Promise resolves when it's ready, otherwise it rejects immediately. 
+ **wait** `({ server, proxy, cookies, fingerprint })` also launches a browser instance and returns a Promise.<br/>
If the slot isn't available it waits until the next slot becomes available and resolves when the browser is ready.

### method parameters
+ **server**: the location of the backend container (default is `localhost`)
+ **proxy**: the proxy to use for the browser context. http/s or socks4/5, example: `socks5://with:auth@server:port`
+ **cookies**:  cookies for this browser context.
+ **fingerprint**: if you want to customize the fingerprint for your instance.


***
### Fingerprinting
This class configures the fingerprinting options of the browser instance you want to create as supported by the stealth browser (currently Camoufox).
```javascript
import { wait, Fingerprint } from 'talquen'
const fingerprint = new Fingerprint();
fingerprint.os("windows");
fingerprint.window(1440);

const browser = await talquen.wait({ fingerprint });
```
+ **os**: select the platform: ***windows, macos, linux*** (defaults to selecting a random one each time).
+ **window**: explicitly set the window dimensions: string pattern [WWWW]x[hhh] or numeric width.
    - Passes values such as "1024x768" along blindly.
    - These are special width values: ***3840, 1920, 1680, 1600, 1440, 1280, 1024, 800*** the common resolution is set.
    - If the width is arbitrary it will calculate the height using a 16:9 aspect ratio.
+ **locale**: If you need a specific Locale, usually picks a default relative to the geolocation of the server / proxy IP address, timezone does this automatically as well.
+ **enableCache**: Whether to cache previous pages, requests, etc. Disabled by default as it uses more memory.
+ **enableMainWorldEval**: By default, all JavaScript execution is ran in an isolated scope, invisible to the page. This makes it impossible for the page to detect JavaScript reading the DOM: **However, your JavaScript will not be able to modify the DOM:** This method lets you modify the DOM, by running JavaScript in the **main world**—the non-isolated scope. ***Some sites may be able to detect your running scripts or DOM changes***.
+ **enablePersistentContext**: Whether to create a persistent context.
+ **humanize**: Humanize the cursor movement. Takes either True, or the MAX duration in seconds of the cursor movement. The cursor typically takes up to 1.5 seconds to move across the window.
+ **webgl**: Use a specific WebGL vendor/renderer pair. The [vendor & renderer combination must be supported](https://camoufox.com/webgl-research/) for the target os or this will cause leaks.
+ **disableCoop**: Disables the Cross-Origin-Opener-Policy (COOP). This allows elements in cross-origin iframes, such as the Turnstile checkbox, to be clicked.
+ **blockImages**: Blocks all requests to images. This can help save your proxy usage.
+ **blockWebRTC**: Blocks WebRTC entirely.
+ **blockWebGL**: Whether to block WebGL. To prevent leaks, only use this for special cases.
***
Like  `toltha` (a thin undici wrapper) this library is named using Tolkien's elven language:
***[talquen](https://www.elfdict.com/w/foot-soldier?include_old=1&natural_language=0)*** means "foot-soldier" 
