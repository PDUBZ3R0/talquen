
import { firefox } from 'playwright-extra'
import { PoolIdleConnectionPlugin } from './idle.js'
import { WebSocket } from 'ws'

import { Fingerprint as FP } from './fingering.js'

export const Fingerprint = FP;

function factory(action) {
	return function(opts={ server: "localhost" }){
		const { server, proxy, cookies, fingerprint: _fp_ } = opts;
		const fingerprint = _fp_ || new FP();
		if (proxy) fingerprint.proxy = proxy;

		let config = {
			fingerprint: fingerprint.fingerprint,
			action
		}

		return new Promise((resolve,reject)=>{
			const ws = new WebSocket(`ws://${server}:42200/`);
			let handled = false;

			function err(e) {
				if (!handled) { 
					handled = true;
					ws.close();
					reject(e);
				}
			}

			ws.on('error', err);

			ws.on('open', function open() {
				ws.on('message', async message=>{

					const res = JSON.parse(message.toString("utf-8"));
					if (res.success && !handled) {
						firefox.use(new PoolIdleConnectionPlugin({ handler: method=>{
							let sendback = { action: "activity", method, port: res.port };
							ws.send(JSON.stringify(sendback));
						}}))

						firefox.connect(`ws://${server}:${res.port}/camoufox`).then(browser=>{

							browser.close = browser.disconnect = function() {
								let sendback = { action: "close", port: res.port };
								ws.send(JSON.stringify(sendback));
								ws.close();

								return new Promise(r=>r());
							}

							return resolve(browser);
						}).catch(err);
					} else {
						err(res.error);
					}
				})
			  	ws.send(JSON.stringify(config));
			});
		});
	}
}

export const launch = factory("launch");
export const wait = factory("wait");

export default {
	launch,
	wait
}