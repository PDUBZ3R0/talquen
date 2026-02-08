## talquen/ *hybrid*

Uses talquen in place of an http client (like toltha, fetch, axios, etc) for simple scraping operations where only the html/dom  is needed, but a real browser is required to render the page first (because of Javascript, cloudflare turnstyle, etc). 

```javascript
import { hybrid } from 'talquen/hybrid'
const client = await hybrid();
const response = await client.load(uri);
```
**hybrid** `({ server, proxy, cookies })` 

The hybrid function takes the same parameters as talquen methods (it automatically calls wait with randomized fingerprinting). Returns a Promise that resolves with a hybrid context. This object allows you to make multiple calls from the same browser context to different urls, if you need to access multiple pages on a site, or the same with changed parameters, i.e. to support pagination, etc.

### hybrid context
+ **load** `(url, { waitUntil })` pass the url and optionally a value for playwright's `waitUntil`: valid options ***load, domcontentloaded, networkidle, commit***<br/>
returns a Promise that resolves to a hybrid response:
   
    + **dom**() returns a Promise that resolves with a cheerio object representing the page dom (query the content using selectors using syntax identical to jQuery).
    + **source**() returns a Promise that resolves with the source of the page as a string.
    
+ **close** () call this when you are finished with this context.

***
[BACK](README.md) to talquen