
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin';


function activityMonitor(target, methodName, handler) {
    const originalCode = target[methodName]
    target[methodName] = (...args) => {
        handler(name);
        return originalCode.apply(target, args)
    };
}

export class PoolIdleConnectionPlugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts)
  }

  get name() {
    return 'idle-connection'
  }

  async onPageCreated(page) {
    const methods = (Object.getOwnPropertyNames(page).filter(function (p) { return typeof page[p] === 'function'; }));
    methods.forEach(name=>activityMonitor(page,name,this.opts.handler));
  }
}

