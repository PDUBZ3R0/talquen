
import { chromium } from 'playwright-extra'
import { default as StealthPlugin } from 'puppeteer-extra-plugin-stealth'
import { PoolIdleConnectionPlugin } from './idle.js'
import { BotBrowserConfig } from './config.js'
import { WebSocket } from 'ws'

export const BrowserConf = BotBrowserConfig;

function factory(action) {
	return function(config) {
		if (!config) config = configure();

		config.action = action;

		return new Promise((resolve,reject)=>{
			const ws = new WebSocket('ws://localhost:42200/');
			let handled = false;

			function err(e) {
				console.log(e.message);
				if (!handled) { 
					reject(e);
					handled = true;
				}
			}

			ws.on('error', err);

			ws.on('open', function open() {
				ws.on('message', async message=>{

					const res = JSON.parse(message.toString("utf-8"));
					if (res.success && !handled) {
						chromium.use(StealthPlugin());
						chromium.use(new PoolIdleConnectionPlugin({ handler: method=>{
							ws.send(JSON.stringify({ action: "activity", method, port: res.port }));
						}}))

						chromium.connectOverCDP('http://localhost:'+res.port).then(browser=>{

							browser.close = browser.disconnect = function() {
								ws.send(JSON.stringify({ action: "close", port: res.port }));
								ws.close();

								return new Promise(r=>r());

								browser.close = browser.disconnect = function() {
									return new Promise(r=>r());
								}
							}

							return resolve(browser);
						}).catch(err);
					} else {
						err(res.error);
					}
				})
			  	ws.send(config.toString());
			});
		});
	}
}

export const launch = factory("launch");
export const wait = factory("wait");

export function configure() {
	return new BotBrowserConfig();
}

export function randomize() {
	return BotBrowserConfig.randomize();
}

export function destroy() {
	const ws = new WebSocket('ws://localhost:42200/');
	ws.on('error', console.error);

	ws.on('open', function open() {
		ws.send(JSON.stringify({ action: "destroy" }));
		ws.close();
	})
}