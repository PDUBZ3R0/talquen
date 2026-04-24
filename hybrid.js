
import { wait } from './index.js'
import { load } from 'cheerio'

export { Fingerprint } from './fingering.js'

export async function hybrid(opts) {
	const { server, proxy, cookies, fingerprint } = opts;

	let s = server || "localhost";

	return new Promise(async r1=>{
		const browser = await wait({ server: s, proxy, cookies, fingerprint });
		const page = await browser.newPage();
		
		const autoclose = (()=>{
			let timer;

			function start() {
					stop();

					timer = setTimeout(()=>{
						(async()=>{
							console.warn("[talquen] hybrid not closed or reused after 10s, timing out reuse window and closing to free up resources.");
							await page.close();
							await browser.close();
						})();
					},10000);
				}

			function stop() {
					if (timer) clearTimeout(timer);
				}
			

			return { start, stop };

		})();

		const api = {
			async load(uri, opt) {
				opt = opt || { waitUntil: "load" };
				const { waitUntil } = opt;

				autoclose.stop();

				return new Promise(async (resolve, reject)=>{
					try {
						page.goto(uri, { waitUntil }).then(()=>{

							resolve({
								source() {
									return new Promise((r,x)=>{
										autoclose.start();

										page.content().then(html=>{
											r(html);
										}).catch(x);
									})
								},
								dom() {
									return new Promise((r,x)=>{
										autoclose.start();
										
										page.content().then(html=>{
											let $ = load(html);
											$.plaintext = html;
											r ($);
										}).catch(x);
									})
								}
							})
						}).catch(reject);
					} catch(ex) {
						reject(ex);
					}
				})
			},

			close(){
				(async ()=>{
					autoclose.stop();
					await page.close();
					await browser.close();
				})();
			}
		}

		r1 (api);
	})
}

export default hybrid;