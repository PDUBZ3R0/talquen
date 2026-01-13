
import { wait, randomize } from './index.js'
import { load } from 'cheerio'

export async function hybrid() {
	return new Promise(async r1=>{
		const browser = await wait(randomize());
		const page = await browser.newPage();
		
		const api = {
			async load(uri, { waitUntil="load" }) {
				return new Promise(async (resolve, reject)=>{
					try {
						page.goto(uri, { waitUntil }).then(()=>{
							resolve({
								source() {
									return new Promise((r,x)=>{
										page.content().then(r).catch(x);
									})
								},
								dom() {
									return new Promise((r,x)=>{
										page.content().then(html=>{
											let $ = load(html);
											r ({ $, html });
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

			async close(){
				await browser.close();
			}
		}

		r1 (api);
	})
}